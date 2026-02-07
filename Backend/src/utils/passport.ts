import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User from "../models/User";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: Error | null, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        const user = await User.findOneAndUpdate(
          { primary_email: email },
          {
            $setOnInsert: {
              user_id: profile.id,
              primary_email: email,
            },
            $set: {
              full_name: profile.displayName,
              display_name: profile.name?.givenName || profile.displayName,
              source_accounts: {
                google: {
                  id: profile.id,
                  email: email,
                  picture: profile.photos?.[0]?.value,
                },
              },
            },
          },
          { upsert: true, new: true }
        );

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: Error | null, id?: any) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: any, done: (err: Error | null, user?: any) => void) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err as Error, null);
  }
});

export default passport;
