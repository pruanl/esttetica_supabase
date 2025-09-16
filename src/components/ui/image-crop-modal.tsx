import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import type { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from './button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Loader2 } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedFile: File) => void
  imageFile: File | null
  aspectRatio?: number
  cropShape?: 'rect' | 'round'
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
  aspectRatio = 1, // 1:1 for square crop by default
  cropShape = 'round'
}) => {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState('')

  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
      })
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }, [aspectRatio])

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = crop.width
      canvas.height = crop.height

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      )

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Canvas is empty')
          }
          const file = new File([blob], imageFile?.name || 'cropped-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(file)
        }, 'image/jpeg', 0.9)
      })
    },
    [imageFile]
  )

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return

    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop)
      onCropComplete(croppedFile)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setImgSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Ajuste a área da imagem que será usada como foto de perfil
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={cropShape === 'round'}
              className="max-h-96"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-96 max-w-full"
              />
            </ReactCrop>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}