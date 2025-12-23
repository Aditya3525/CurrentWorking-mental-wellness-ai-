import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createRequestLogger } from '../utils/logger';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../shared/errors/AppError';
import { formatZodErrors } from '../utils/zodHelpers';

// Validation schema
const bookingSchema = z.object({
  therapistId: z.string(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().max(500).optional(),
  userPhone: z.string().optional()
});

/**
 * Get all active therapists
 * GET /api/therapists
 */
export const getTherapists = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'getTherapists'
  });

  try {
    const { 
      specialty, 
      city, 
      state, 
      acceptsInsurance,
      limit = '20',
      offset = '0'
    } = req.query;

    const therapists = await prisma.therapist.findMany({
      where: {
        isActive: true,
        isVerified: true,
        ...(city && { city: city as string }),
        ...(state && { state: state as string }),
        ...(acceptsInsurance === 'true' && { acceptsInsurance: true }),
        ...(specialty && {
          specialtiesJson: {
            contains: specialty as string
          }
        })
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        name: true,
        credential: true,
        title: true,
        bio: true,
        specialtiesJson: true,
        city: true,
        state: true,
        acceptsInsurance: true,
        insurances: true,
        sessionFee: true,
        offersSliding: true,
        availabilityJson: true,
        profileImageUrl: true,
        yearsExperience: true,
        languages: true,
        rating: true,
        reviewCount: true
      }
    });

    // Parse JSON fields
    const therapistsWithParsed = therapists.map(t => ({
      ...t,
      specialties: JSON.parse(t.specialtiesJson),
      availability: JSON.parse(t.availabilityJson),
      insurancesList: t.insurances ? JSON.parse(t.insurances) : []
    }));

    log.info({ count: therapists.length }, 'Fetched therapists');

    res.json({
      success: true,
      data: { 
        therapists: therapistsWithParsed,
        total: therapists.length
      }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch therapists');
    res.status(500).json({ success: false, error: 'Failed to fetch therapists' });
  }
};

/**
 * Get therapist by ID
 * GET /api/therapists/:id
 */
export const getTherapistById = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'getTherapist'
  });

  try {
    const { id } = req.params;

    const therapist = await prisma.therapist.findFirst({
      where: {
        id,
        isActive: true,
        isVerified: true
      }
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    // Parse JSON fields
    const therapistData = {
      ...therapist,
      specialties: JSON.parse(therapist.specialtiesJson),
      availability: JSON.parse(therapist.availabilityJson),
      insurancesList: therapist.insurances ? JSON.parse(therapist.insurances) : []
    };

    log.info({ therapistId: id }, 'Fetched therapist details');

    res.json({
      success: true,
      data: { therapist: therapistData }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch therapist');
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch therapist' });
  }
};

/**
 * Search therapists
 * GET /api/therapists/search?q=query
 */
export const searchTherapists = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'searchTherapists'
  });

  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      res.json({
        success: true,
        data: { therapists: [] }
      });
      return;
    }

    const searchTerm = query.toLowerCase();

    const therapists = await prisma.therapist.findMany({
      where: {
        isActive: true,
        isVerified: true,
        OR: [
          { name: { contains: searchTerm } },
          { bio: { contains: searchTerm } },
          { specialtiesJson: { contains: searchTerm } },
          { city: { contains: searchTerm } }
        ]
      },
      orderBy: { rating: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        credential: true,
        title: true,
        bio: true,
        specialtiesJson: true,
        city: true,
        state: true,
        rating: true,
        reviewCount: true,
        acceptsInsurance: true,
        profileImageUrl: true
      }
    });

    const therapistsWithParsed = therapists.map(t => ({
      ...t,
      specialties: JSON.parse(t.specialtiesJson)
    }));

    log.info({ query, resultCount: therapists.length }, 'Therapist search completed');

    res.json({
      success: true,
      data: { therapists: therapistsWithParsed }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to search therapists');
    res.status(500).json({ success: false, error: 'Failed to search therapists' });
  }
};

/**
 * Request therapist booking
 * POST /api/therapists/booking
 */
export const requestBooking = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'requestBooking',
    userId: req.user.id 
  });

  try {
    const validation = bookingSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(formatZodErrors(validation.error), 'Invalid booking data');
    }

    const userId = req.user.id;
    const { therapistId, preferredDate, preferredTime, message, userPhone } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify therapist exists and is active
    const therapist = await prisma.therapist.findFirst({
      where: {
        id: therapistId,
        isActive: true
      }
    });

    if (!therapist) {
      throw new NotFoundError('Therapist not found or not available');
    }

    const booking = await prisma.therapistBooking.create({
      data: {
        userId,
        therapistId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        message: message || null,
        userEmail: user.email,
        userPhone: userPhone || null,
        status: 'PENDING'
      },
      include: {
        therapist: {
          select: {
            name: true,
            title: true,
            email: true
          }
        }
      }
    });

    log.info({ bookingId: booking.id, therapistId }, 'Booking request created');

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Booking request submitted successfully. The therapist will contact you soon.'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to create booking request');
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to submit booking request' });
  }
};

/**
 * Get user's booking requests
 * GET /api/therapists/bookings
 */
export const getUserBookings = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'getUserBookings',
    userId: req.user.id 
  });

  try {
    const userId = req.user.id;

    const bookings = await prisma.therapistBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        therapist: {
          select: {
            name: true,
            credential: true,
            title: true,
            email: true,
            phone: true,
            city: true,
            state: true
          }
        }
      }
    });

    log.info({ count: bookings.length }, 'Fetched user bookings');

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch bookings');
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

/**
 * Cancel booking request
 * DELETE /api/therapists/bookings/:id
 */
export const cancelBooking = async (req: any, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'therapist', 
    action: 'cancelBooking',
    userId: req.user.id 
  });

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await prisma.therapistBooking.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'COMPLETED') {
      throw new ValidationError('Cannot cancel completed booking');
    }

    await prisma.therapistBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    log.info({ bookingId: id }, 'Booking cancelled');

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to cancel booking');
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};
