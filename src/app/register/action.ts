'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  // Handle profile image upload
  let profileImageUrl: string | null = null;
  const profileImage = formData.get('profileImage') as string;

  if (profileImage && profileImage.startsWith('data:image/') && authData.user) {
    try {
      // Extract the base64 data and mime type
      const [mimeInfo, base64Data] = profileImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const fileName = `${authData.user.id}_${Date.now()}.${mimeType.split('/')[1]}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('Profile image upload error:', uploadError);
        // Continue without profile image if upload fails
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        profileImageUrl = urlData.publicUrl;
      }
    } catch (error) {
      console.error('Error processing profile image:', error);
      // Continue without profile image if processing fails
    }
  }

  // Create user profile in the users table
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: formData.get('username') as string,
        profile_image_url: profileImageUrl,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // You might want to handle this error differently
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
