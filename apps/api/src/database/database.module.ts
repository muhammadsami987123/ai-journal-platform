import { Global, Module, type OnApplicationShutdown } from "@nestjs/common";
import { getDatabase, type Database } from "@journal/database";

export const DATABASE = Symbol("DATABASE");

/**
 * Single database provider. Only repositories inject it — controllers and
 * services never touch Drizzle directly (architectural invariant #4).
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => getDatabase().db
    },
    {
      // `pg` keeps sockets open; without this the process hangs on Ctrl+C.
      provide: "DATABASE_LIFECYCLE",
      useFactory: (): OnApplicationShutdown => ({
        async onApplicationShutdown() {
          await getDatabase().pool.end().catch(() => undefined);
        }
      })
    }
  ],
  exports: [DATABASE]
})
export class DatabaseModule {}
