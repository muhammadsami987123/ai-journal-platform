import { Injectable, Logger } from "@nestjs/common";
import type {
  MeResponse,
  Preferences,
  PreferencesUpdateInput,
  Profile,
  ProfileUpdateInput
} from "@journal/shared";
import { ensureUserRecords } from "../../auth/account-bootstrap.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { UsersRepository } from "./users.repository.js";

@Injectable()
export class UsersService {
  private readonly logger = new Logger("UsersService");

  constructor(private readonly repository: UsersRepository) {}

  /**
   * Returns user + profile + preferences, repairing an account whose
   * bootstrap hook failed after Better Auth created the user.
   */
  async me(user: AuthenticatedUser): Promise<MeResponse> {
    try {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image
        },
        profile: await this.repository.getProfile(user.id),
        preferences: await this.repository.getPreferences(user.id)
      };
    } catch {
      this.logger.warn(`Repairing missing account rows for ${user.id}`);
      await ensureUserRecords({ userId: user.id, name: user.name, email: user.email });
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image
        },
        profile: await this.repository.getProfile(user.id),
        preferences: await this.repository.getPreferences(user.id)
      };
    }
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile> {
    return this.repository.updateProfile(userId, input);
  }

  async updatePreferences(userId: string, input: PreferencesUpdateInput): Promise<Preferences> {
    return this.repository.updatePreferences(userId, input);
  }

  async exportAll(userId: string): Promise<Record<string, unknown>> {
    return this.repository.exportAll(userId);
  }
}
