// Simula la latencia de una API: espera un poco y devuelve (o lanza) lo que retorne getData.
export async function mockRequest<T>(getData: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getData();
}
