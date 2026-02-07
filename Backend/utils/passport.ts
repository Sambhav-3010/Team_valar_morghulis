import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/auth/google/callback",
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: (err: Error | null, user?: any) => void) => {
      try {
        let user = await User.findOne({ email: profile.emails?.[0].value });
        if (!user) {
          const pass = Math.floor(Math.random() * 90000000 + 10000000);
          const hashed = await bcrypt.hash(pass.toString(), 10);

          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0].value,
            password: hashed,
          });

          await user.save();
        }

        const userWithTokens = {
          ...user.toObject(),
        };
        return done(null, userWithTokens);
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
