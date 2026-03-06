import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function bufferToStream(buffer) {
  const readable = new Readable()
  readable.push(buffer)
  readable.push(null)
  return readable
}

function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    bufferToStream(buffer).pipe(stream)
  })
}

// POST /upload/item-image — upload one item image (max 5 per item)
export const uploadItemImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' })

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'student_shop/items',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
      ],
    })

    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err) {
    console.error('Cloudinary item upload error:', err)
    res.status(500).json({ error: 'Image upload failed.' })
  }
}

// ✅ DELETE /upload/item-image — delete an orphaned image from Cloudinary
// Called by frontend when:
//   (a) user removes an image before submitting the form
//   (b) user cancels the form entirely (component unmount cleanup)
export const deleteItemImage = async (req, res) => {
  try {
    const { publicId } = req.body
    if (!publicId) return res.status(400).json({ error: 'publicId is required.' })

    // Security: only allow deleting from student_shop/items folder
    if (!publicId.startsWith('student_shop/items/')) {
      return res.status(403).json({ error: 'Cannot delete images outside student_shop/items.' })
    }

    await cloudinary.uploader.destroy(publicId)
    res.json({ message: 'Image deleted.' })
  } catch (err) {
    console.error('Cloudinary delete error:', err)
    res.status(500).json({ error: 'Failed to delete image.' })
  }
}

// POST /upload/avatar — upload profile avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' })

    const userId = req.user.userId

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'student_shop/avatars',
      public_id:      `avatar_${userId}`,
      overwrite:      true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' }
      ],
    })

    res.json({ url: result.secure_url })
  } catch (err) {
    console.error('Cloudinary avatar upload error:', err)
    res.status(500).json({ error: 'Avatar upload failed.' })
  }
}