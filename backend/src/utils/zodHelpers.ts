// Helper function to convert Zod errors to ValidationError format
export const formatZodErrors = (zodError: any): Record<string, string[]> => {
  return zodError.errors.reduce((acc: Record<string, string[]>, err: any) => {
    const path = err.path.join('.') || 'general';
    if (!acc[path]) acc[path] = [];
    acc[path].push(err.message);
    return acc;
  }, {});
};
