// Utility for handling transient database connection errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRetryableError = 
        error?.code === '57P01' || // admin command termination
        error?.code === '08006' || // connection failure
        error?.code === '53300' || // too many connections
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('terminating connection');

      if (isRetryableError && attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        console.log(`Database connection error on attempt ${attempt}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retry attempts exceeded');
}