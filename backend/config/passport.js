import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let existingUser = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (existingUser) {
          // Update existing user's last login and refresh token
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLogin: new Date(),
              refreshToken: refreshToken || existingUser.refreshToken,
              profilePicture: profile.photos?.[0]?.value || existingUser.profilePicture,
            },
          });
          return done(null, updatedUser);
        }

        // Check if user exists with same email but no Google ID (account linking)
        const userByEmail = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        if (userByEmail) {
          // Link Google account to existing user
          const linkedUser = await prisma.user.update({
            where: { id: userByEmail.id },
            data: {
              googleId: profile.id,
              lastLogin: new Date(),
              refreshToken: refreshToken,
              profilePicture: profile.photos?.[0]?.value || userByEmail.profilePicture,
              provider: 'google',
            },
          });
          return done(null, linkedUser);
        }

        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            username: profile.emails[0].value.split('@')[0], // Use email prefix as username
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
            provider: 'google',
            lastLogin: new Date(),
            refreshToken: refreshToken,
          },
        });

        return done(null, newUser);
      } catch (error) {
        console.error('OAuth Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        provider: true,
        lastLogin: true,
        createdAt: true,
        // Don't include refreshToken in session for security
      },
    });

    if (!user) {
      return done(new Error('User not found'), null);
    }

    done(null, user);
  } catch (error) {
    console.error('Deserialize User Error:', error);
    done(error, null);
  }
});

export default passport;