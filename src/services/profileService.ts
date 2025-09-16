import { supabase } from '../lib/supabaseClient';
import type { Profile, ProfileInsert, GalleryPhoto } from '../types/database';
import type { UsernameAvailabilityResult } from '../utils/usernameValidation';

export class ProfileService {
  // Get current user's profile
  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Create or update profile
  static async upsertProfile(profileData: Partial<ProfileInsert>): Promise<Profile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
  }

  // Upload image to storage
  static async uploadImage(file: File, bucket: 'avatars' | 'gallery', fileName?: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const finalFileName = fileName || `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, file, {
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Delete image from storage
  static async deleteImage(url: string, bucket: 'avatars' | 'gallery'): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Gallery photos operations
  static async getGalleryPhotos(): Promise<GalleryPhoto[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
      throw error;
    }
  }

  static async addGalleryPhoto(photoUrl: string, description?: string): Promise<GalleryPhoto> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('gallery_photos')
        .insert({
          photo_url: photoUrl,
          user_id: user.id,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding gallery photo:', error);
      throw error;
    }
  }

  static async deleteGalleryPhoto(id: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First get the photo to delete the image from storage
      const { data: photo } = await supabase
        .from('gallery_photos')
        .select('photo_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (photo?.photo_url) {
        await this.deleteImage(photo.photo_url, 'gallery');
      }

      // Then delete the record
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting gallery photo:', error);
      throw error;
    }
  }

  // Get public profile by user ID (for public page)
  static async getPublicProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw error;
    }
  }

  // Get public gallery photos by user ID
  static async getPublicGalleryPhotos(userId: string): Promise<GalleryPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public gallery photos:', error);
      throw error;
    }
  }

  // Check username availability
  static async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id) // Exclude current user
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const available = !data; // Available if no data found

      return {
        available,
        formatted_username: username,
        message: available ? 'Username disponível' : 'Username já está em uso'
      };
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        formatted_username: username,
        message: 'Erro ao verificar disponibilidade'
      };
    }
  }
}