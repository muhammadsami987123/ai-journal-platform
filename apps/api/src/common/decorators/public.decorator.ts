import { SetMetadata } from "@nestjs/common";

/**
 * The key is fixed by @thallesp/nestjs-better-auth: its global AuthGuard
 * reads `PUBLIC` and skips authentication when it is true.
 */
export const IS_PUBLIC_KEY = "PUBLIC";

/**
 * Explicit opt-out of the global auth guard. Routes are private by default,
 * so forgetting a guard cannot expose data (T2.2).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
