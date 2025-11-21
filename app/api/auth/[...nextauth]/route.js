import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_CREDITS } from '@/utils/credits';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!supabaseAdmin) {
          console.error('Supabase admin client not initialized');
          return false;
        }

        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          return false;
        }

        if (!existingUser) {
          // Create new user
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
              credits: DEFAULT_CREDITS,
            });

          if (insertError) {
            console.error('Error creating user:', insertError);
            return false;
          }

          // Add welcome bonus transaction
          const { data: newUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (newUser) {
            await supabaseAdmin
              .from('credit_transactions')
              .insert({
                user_id: newUser.id,
                amount: DEFAULT_CREDITS,
                type: 'bonus',
                description: 'Welcome bonus',
              });
          }
        } else {
          // Update user info
          await supabaseAdmin
            .from('users')
            .update({
              name: user.name,
              image: user.image,
            })
            .eq('email', user.email);
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        if (!supabaseAdmin) {
          return session;
        }

        // Fetch user data from Supabase
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('id, email, name, image, credits')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Error fetching user in session:', error);
          return session;
        }

        // Add user data to session
        session.user.id = user.id;
        session.user.credits = user.credits;

        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
