import { Request, Response } from 'express';
import supabase from '../config/supabase';

/**
 * POST /api/upload
 * Handles image uploading (avatars, team logos, tournament banners).
 * Accepts base64 encoded image or raw image data and uploads to Supabase storage or returns asset URL.
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64, filename, folder = 'general' } = req.body;

    if (!base64) {
      res.status(400).json({ error: 'Image data (base64) is required' });
      return;
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = (filename && filename.split('.').pop()) || 'jpg';
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    try {
      const { data, error } = await supabase.storage
        .from('criclivex-assets')
        .upload(filePath, buffer, {
          contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('criclivex-assets')
          .getPublicUrl(filePath);

        res.status(200).json({
          url: publicUrlData.publicUrl,
          path: filePath,
        });
        return;
      }
    } catch (storageErr) {
      console.log('Supabase storage fallback to data URI');
    }

    // Fallback: If bucket is not yet configured or in local offline mode, return standard base64 data URI
    const dataUri = `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${cleanBase64}`;
    res.status(200).json({
      url: dataUri,
      path: filePath,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
};
