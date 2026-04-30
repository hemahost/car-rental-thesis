import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

interface OAuthUser {
  id: string;
  role: string;
}

type FindOrCreateOAuthUser = (
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatarUrl: string
) => Promise<OAuthUser>;

interface OAuthStrategyFactoryOptions {
  backendUrl: string;
  findOrCreateUser: FindOrCreateOAuthUser;
}

export function createGoogleOAuthStrategy({
  backendUrl,
  findOrCreateUser,
}: OAuthStrategyFactoryOptions): GoogleStrategy {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${backendUrl}/api/oauth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? `${profile.id}@google.oauth`;
        const name = profile.displayName || "Google User";
        const avatarUrl = profile.photos?.[0]?.value ?? "";
        const user = await findOrCreateUser("google", profile.id, email, name, avatarUrl);
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  );
}

export function createGitHubOAuthStrategy({
  backendUrl,
  findOrCreateUser,
}: OAuthStrategyFactoryOptions): GitHubStrategy {
  const strategy = new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      callbackURL: `${backendUrl}/api/oauth/github/callback`,
      scope: ["user:email"],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value ?? `${profile.id}@github.oauth`;
        const name = profile.displayName || profile.username || "GitHub User";
        const avatarUrl = profile.photos?.[0]?.value ?? "";
        const user = await findOrCreateUser("github", String(profile.id), email, name, avatarUrl);
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  );

  strategy.authorizationParams = () => ({
    prompt: "select_account",
  });

  return strategy;
}
