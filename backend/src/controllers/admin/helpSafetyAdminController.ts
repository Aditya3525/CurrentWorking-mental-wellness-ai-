import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { createRequestLogger } from '../../utils/logger';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../../shared/errors/AppError';
import { logActivity as logAdminActivity } from './activityLogController';
import { formatZodErrors } from '../../utils/zodHelpers';

// Validation schemas
const createFAQSchema = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(20).max(2000),
  category: z.enum(['GENERAL', 'PRIVACY', 'ASSESSMENTS', 'CHATBOT', 'BILLING', 'TECHNICAL', 'SAFETY']),
  order: z.number().optional(),
  tags: z.string().optional()
});

const updateFAQSchema = createFAQSchema.partial();

const createCrisisResourceSchema = z.object({
  name: z.string().min(3).max(200),
  type: z.enum(['HOTLINE', 'TEXT_LINE', 'CHAT_SERVICE', 'EMERGENCY', 'SUPPORT_GROUP', 'WEBSITE']),
  phoneNumber: z.string().optional(),
  textNumber: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().min(10).max(1000),
  availability: z.string(),
  country: z.string().default('US'),
  language: z.string().default('English'),
  order: z.number().optional(),
  tags: z.string().optional()
});

const updateCrisisResourceSchema = createCrisisResourceSchema.partial();

const createTherapistSchema = z.object({
  name: z.string().min(3).max(200),
  credential: z.enum(['PSYCHOLOGIST', 'PSYCHIATRIST', 'LCSW', 'LMFT', 'LPC', 'LMHC']),
  title: z.string(),
  bio: z.string().min(50).max(2000),
  specialtiesJson: z.string(), // JSON array
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
  acceptsInsurance: z.boolean().optional(),
  insurances: z.string().optional(), // JSON array
  sessionFee: z.number().optional(),
  offersSliding: z.boolean().optional(),
  availabilityJson: z.string(), // JSON array
  profileImageUrl: z.string().url().optional(),
  yearsExperience: z.number().optional(),
  languages: z.string().optional(),
  isVerified: z.boolean().optional()
});

const updateTherapistSchema = createTherapistSchema.partial();

/**
 * Get all support tickets (Admin)
 * GET /api/admin/support/tickets
 */
export const getAllTickets = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminSupport', 
    action: 'getAllTickets'
  });

  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any })
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.supportTicket.count({
      where: {
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any })
      }
    });

    log.info({ count: tickets.length, total }, 'Fetched all support tickets');

    res.json({
      success: true,
      data: {
        tickets,
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch tickets');
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
};

/**
 * Respond to support ticket (Admin)
 * POST /api/admin/support/tickets/:id/respond
 */
export const respondToTicket = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminSupport', 
    action: 'respondToTicket',
    adminEmail
  });

  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
      throw new ValidationError('Response must be at least 10 characters');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        response,
        respondedBy: adminEmail,
        respondedAt: new Date(),
        status: 'RESOLVED',
        updatedAt: new Date()
      }
    });

    await logAdminActivity(
      adminEmail,
      'RESPOND',
      'SUPPORT_TICKET',
      id,
      ticket.subject,
      { responseLength: response.length },
      req
    );

    log.info({ ticketId: id }, 'Responded to support ticket');

    res.json({
      success: true,
      data: { ticket: updatedTicket },
      message: 'Response sent successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to respond to ticket');
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to respond to ticket' });
  }
};

/**
 * Close support ticket (Admin)
 * PUT /api/admin/support/tickets/:id/close
 */
export const closeTicket = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminSupport', 
    action: 'closeTicket',
    adminEmail
  });

  try {
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    await logAdminActivity(
      adminEmail,
      'DELETE',
      'SUPPORT_TICKET',
      id,
      ticket.subject,
      undefined,
      req
    );

    log.info({ ticketId: id }, 'Closed support ticket');

    res.json({
      success: true,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to close ticket');
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to close ticket' });
  }
};

// ===== FAQ MANAGEMENT =====

/**
 * Create FAQ (Admin)
 * POST /api/admin/faq
 */
export const createFAQ = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminFAQ', 
    action: 'createFAQ',
    adminEmail
  });

  try {
    const validation = createFAQSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid FAQ data');
    }

    const faq = await prisma.fAQ.create({
      data: {
        ...validation.data,
        createdBy: adminEmail
      }
    });

    await logAdminActivity(
      adminEmail,
      'CREATE',
      'FAQ',
      faq.id,
      faq.question,
      undefined,
      req
    );

    log.info({ faqId: faq.id }, 'FAQ created');

    res.status(201).json({
      success: true,
      data: { faq },
      message: 'FAQ created successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to create FAQ');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to create FAQ' });
  }
};

/**
 * Update FAQ (Admin)
 * PUT /api/admin/faq/:id
 */
export const updateFAQ = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminFAQ', 
    action: 'updateFAQ',
    adminEmail
  });

  try {
    const { id } = req.params;
    const validation = updateFAQSchema.safeParse(req.body);
    
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid FAQ data');
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: validation.data
    });

    await logAdminActivity(
      adminEmail,
      'UPDATE',
      'FAQ',
      id,
      faq.question,
      undefined,
      req
    );

    log.info({ faqId: id }, 'FAQ updated');

    res.json({
      success: true,
      data: { faq },
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to update FAQ');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to update FAQ' });
  }
};

/**
 * Delete FAQ (Admin)
 * DELETE /api/admin/faq/:id
 */
export const deleteFAQ = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminFAQ', 
    action: 'deleteFAQ',
    adminEmail
  });

  try {
    const { id } = req.params;

    const faq = await prisma.fAQ.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundError('FAQ not found');
    }

    await prisma.fAQ.delete({ where: { id } });

    await logAdminActivity(
      adminEmail,
      'DELETE',
      'FAQ',
      id,
      faq.question,
      undefined,
      req
    );

    log.info({ faqId: id }, 'FAQ deleted');

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to delete FAQ');
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to delete FAQ' });
  }
};

// ===== CRISIS RESOURCE MANAGEMENT =====

/**
 * Create crisis resource (Admin)
 * POST /api/admin/crisis/resources
 */
export const createCrisisResource = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminCrisis', 
    action: 'createResource',
    adminEmail
  });

  try {
    const validation = createCrisisResourceSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid resource data');
    }

    const resource = await prisma.crisisResource.create({
      data: validation.data
    });

    await logAdminActivity(
      adminEmail,
      'CREATE',
      'CRISIS_RESOURCE',
      resource.id,
      resource.name,
      undefined,
      req
    );

    log.info({ resourceId: resource.id }, 'Crisis resource created');

    res.status(201).json({
      success: true,
      data: { resource },
      message: 'Crisis resource created successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to create resource');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to create resource' });
  }
};

/**
 * Update crisis resource (Admin)
 * PUT /api/admin/crisis/resources/:id
 */
export const updateCrisisResource = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminCrisis', 
    action: 'updateResource',
    adminEmail
  });

  try {
    const { id } = req.params;
    const validation = updateCrisisResourceSchema.safeParse(req.body);
    
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid resource data');
    }

    const resource = await prisma.crisisResource.update({
      where: { id },
      data: validation.data
    });

    await logAdminActivity(
      adminEmail,
      'UPDATE',
      'CRISIS_RESOURCE',
      id,
      resource.name,
      undefined,
      req
    );

    log.info({ resourceId: id }, 'Crisis resource updated');

    res.json({
      success: true,
      data: { resource },
      message: 'Crisis resource updated successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to update resource');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to update resource' });
  }
};

/**
 * Delete crisis resource (Admin)
 * DELETE /api/admin/crisis/resources/:id
 */
export const deleteCrisisResource = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminCrisis', 
    action: 'deleteResource',
    adminEmail
  });

  try {
    const { id } = req.params;

    const resource = await prisma.crisisResource.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundError('Crisis resource not found');
    }

    await prisma.crisisResource.delete({ where: { id } });

    await logAdminActivity(
      adminEmail,
      'DELETE',
      'CRISIS_RESOURCE',
      id,
      resource.name,
      undefined,
      req
    );

    log.info({ resourceId: id }, 'Crisis resource deleted');

    res.json({
      success: true,
      message: 'Crisis resource deleted successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to delete resource');
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to delete resource' });
  }
};

// ===== THERAPIST MANAGEMENT =====

/**
 * Create therapist (Admin)
 * POST /api/admin/therapists
 */
export const createTherapist = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminTherapist', 
    action: 'createTherapist',
    adminEmail
  });

  try {
    const validation = createTherapistSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid therapist data');
    }

    const therapist = await prisma.therapist.create({
      data: validation.data
    });

    await logAdminActivity(
      adminEmail,
      'CREATE',
      'THERAPIST',
      therapist.id,
      therapist.name,
      undefined,
      req
    );

    log.info({ therapistId: therapist.id }, 'Therapist created');

    res.status(201).json({
      success: true,
      data: { therapist },
      message: 'Therapist created successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to create therapist');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to create therapist' });
  }
};

/**
 * Update therapist (Admin)
 * PUT /api/admin/therapists/:id
 */
export const updateTherapist = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminTherapist', 
    action: 'updateTherapist',
    adminEmail
  });

  try {
    const { id } = req.params;
    const validation = updateTherapistSchema.safeParse(req.body);
    
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid therapist data');
    }

    const therapist = await prisma.therapist.update({
      where: { id },
      data: validation.data
    });

    await logAdminActivity(
      adminEmail,
      'UPDATE',
      'THERAPIST',
      id,
      therapist.name,
      undefined,
      req
    );

    log.info({ therapistId: id }, 'Therapist updated');

    res.json({
      success: true,
      data: { therapist },
      message: 'Therapist updated successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to update therapist');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to update therapist' });
  }
};

/**
 * Delete therapist (Admin)
 * DELETE /api/admin/therapists/:id
 */
export const deleteTherapist = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminTherapist', 
    action: 'deleteTherapist',
    adminEmail
  });

  try {
    const { id } = req.params;

    const therapist = await prisma.therapist.findUnique({ where: { id } });
    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    // Don't actually delete, just deactivate
    await prisma.therapist.update({
      where: { id },
      data: { isActive: false }
    });

    await logAdminActivity(
      adminEmail,
      'DELETE',
      'THERAPIST',
      id,
      therapist.name,
      undefined,
      req
    );

    log.info({ therapistId: id }, 'Therapist deactivated');

    res.json({
      success: true,
      message: 'Therapist deactivated successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to delete therapist');
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to delete therapist' });
  }
};

/**
 * Get all therapist bookings (Admin)
 * GET /api/admin/therapists/bookings
 */
export const getAllBookings = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminTherapist', 
    action: 'getAllBookings'
  });

  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const bookings = await prisma.therapistBooking.findMany({
      where: {
        ...(status && { status: status as any })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        therapist: {
          select: {
            id: true,
            name: true,
            title: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.therapistBooking.count({
      where: { ...(status && { status: status as any }) }
    });

    log.info({ count: bookings.length, total }, 'Fetched all bookings');

    res.json({
      success: true,
      data: {
        bookings,
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch bookings');
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

/**
 * Process booking (Admin)
 * PUT /api/admin/therapists/bookings/:id/process
 */
export const processBooking = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const adminEmail = req.session?.admin?.email;
  const log = createRequestLogger(requestId).child({ 
    controller: 'adminTherapist', 
    action: 'processBooking',
    adminEmail
  });

  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      throw new ValidationError('Invalid status. Must be CONFIRMED or CANCELLED');
    }

    const booking = await prisma.therapistBooking.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        processedBy: adminEmail,
        processedAt: new Date()
      }
    });

    await logAdminActivity(
      adminEmail,
      'PROCESS',
      'THERAPIST_BOOKING',
      id,
      `Booking for ${booking.therapistId}`,
      { status },
      req
    );

    log.info({ bookingId: id, status }, 'Booking processed');

    res.json({
      success: true,
      data: { booking },
      message: `Booking ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to process booking');
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to process booking' });
  }
};
