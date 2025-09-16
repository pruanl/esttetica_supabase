import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, MapPin, Camera, Trash2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { InteractiveMap } from '@/components/ui/map';
import { ImageCropModal } from '@/components/ui/image-crop-modal';

import { ProfileService } from '@/services/profileService';
import type { GalleryPhoto } from '@/types/database';

const profileSchema = z.object({
  clinic_name: z.string().min(1, 'Nome da clínica é obrigatório'),
  whatsapp_number: z.string().min(1, 'Número do WhatsApp é obrigatório'),
  profile_avatar_url: z.string().optional(),
  cover_photo_url: z.string().optional(),
  address: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  instagram_url: z.string().optional(),
  tiktok_url: z.string().optional(),
  youtube_url: z.string().optional(),
  facebook_url: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ClinicProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressFromCep, setAddressFromCep] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      clinic_name: '',
      whatsapp_number: '',
      profile_avatar_url: '',
      cover_photo_url: '',
      address: '',
      cep: '',
      street: '',
      number: '',
      city: '',
      state: '',
      latitude: undefined,
      longitude: undefined,
      instagram_url: '',
      tiktok_url: '',
      youtube_url: '',
      facebook_url: '',
    },
  });

  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoadingData(true);
      const [profileData, galleryData] = await Promise.all([
        ProfileService.getCurrentProfile(),
        ProfileService.getGalleryPhotos()
      ]);

      if (profileData) {
        form.reset({
          clinic_name: profileData.clinic_name || '',
          whatsapp_number: profileData.whatsapp_number || '',
          profile_avatar_url: profileData.profile_avatar_url || '',
          cover_photo_url: profileData.cover_photo_url || '',
          address: profileData.address || '',
          cep: profileData.cep || '',
          street: profileData.street || '',
          number: profileData.number || '',
          city: profileData.city || '',
          state: profileData.state || '',
          latitude: profileData.latitude || undefined,
          longitude: profileData.longitude || undefined,
          instagram_url: profileData.instagram_url || '',
          tiktok_url: profileData.tiktok_url || '',
          youtube_url: profileData.youtube_url || '',
          facebook_url: profileData.facebook_url || '',
        });
      }

      setGalleryPhotos(galleryData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoadingData(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      await ProfileService.upsertProfile(data);
      toast.success('Perfil salvo com sucesso!');
      await loadProfileData(); // Reload data
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar telefone (copiada do PatientForm)
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para buscar endereço por CEP
  const handleCepSearch = async (cep: string) => {
    try {
      setSearchingAddress(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      // Preencher os campos automaticamente
      form.setValue('street', data.logradouro || '');
      form.setValue('city', data.localidade || '');
      form.setValue('state', data.uf || '');
      
      // Marcar que os campos foram preenchidos pelo CEP
      setAddressFromCep(true);
      
      toast.success('Endereço encontrado!');
      
      // Buscar coordenadas do endereço
      if (data.logradouro && data.localidade) {
        await searchAddressCoordinates(`${data.logradouro}, ${data.localidade}, ${data.uf}`);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Função para buscar coordenadas do endereço
  const handleAddressSearch = async () => {
    const street = form.watch('street');
    const number = form.watch('number');
    const city = form.watch('city');
    const state = form.watch('state');
    
    if (!street || !city) {
      toast.error('Preencha pelo menos a rua e cidade');
      return;
    }
    
    const fullAddress = `${street}${number ? `, ${number}` : ''}, ${city}, ${state}`;
    await searchAddressCoordinates(fullAddress);
  };

  // Função auxiliar para buscar coordenadas
  const searchAddressCoordinates = async (address: string) => {
    try {
      setSearchingAddress(true);
      
      // Usando Nominatim (OpenStreetMap) para geocoding gratuito
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        form.setValue('latitude', lat);
        form.setValue('longitude', lng);
        
        toast.success(`Localização encontrada no mapa!`);
      } else {
        toast.error('Localização não encontrada. Ajuste manualmente no mapa.');
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      toast.error('Erro ao buscar localização');
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleImageSelect = (file: File, type: 'avatar' | 'cover') => {
    setSelectedImageFile(file);
    setCropType(type);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    // Don't specify fileName - let the service handle the path structure
    await handleImageUpload(croppedFile, cropType);
  };

  const handleImageUpload = async (
    file: File, 
    type: 'avatar' | 'cover' | 'gallery',
    fileName?: string
  ) => {
    try {
      const bucket = type === 'gallery' ? 'gallery' : 'avatars';
      
      if (type === 'avatar') setUploadingAvatar(true);
      else if (type === 'cover') setUploadingCover(true);
      else setUploadingGallery(true);

      const imageUrl = await ProfileService.uploadImage(file, bucket, fileName);

      if (type === 'avatar') {
        form.setValue('profile_avatar_url', imageUrl);
        // Auto-save profile after avatar upload
        const currentFormData = form.getValues();
        await ProfileService.upsertProfile({ ...currentFormData, profile_avatar_url: imageUrl });
        toast.success('Avatar atualizado com sucesso!');
      } else if (type === 'cover') {
        form.setValue('cover_photo_url', imageUrl);
        // Auto-save profile after cover upload
        const currentFormData = form.getValues();
        await ProfileService.upsertProfile({ ...currentFormData, cover_photo_url: imageUrl });
        toast.success('Capa atualizada com sucesso!');
      } else {
        // Add to gallery
        await ProfileService.addGalleryPhoto(imageUrl);
        await loadProfileData(); // Reload gallery
        toast.success('Foto adicionada à galeria!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else if (type === 'cover') setUploadingCover(false);
      else setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: number) => {
    try {
      await ProfileService.deleteGalleryPhoto(photoId);
      await loadProfileData(); // Reload gallery
      toast.success('Foto removida da galeria!');
    } catch (error) {
      console.error('Error deleting gallery photo:', error);
      toast.error('Erro ao remover foto da galeria');
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil da Clínica</h1>
          <p className="text-muted-foreground">
            Configure as informações que aparecerão na sua página pública
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da sua clínica que aparecerão na página pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="clinic_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Clínica/Profissional</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Clínica Estética Bella" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do WhatsApp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999" 
                            {...field} 
                            onChange={(e) => {
                              const formattedValue = formatPhone(e.target.value);
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Número que receberá os contatos dos clientes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Informações
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>
              Adicione apenas o username das suas redes sociais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seuperfil" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiktok_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seuperfil" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seucanal" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="suapagina" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isLoading}
                  className="mt-6"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Redes Sociais
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens do Perfil</CardTitle>
            <CardDescription>
              Foto de perfil e capa que aparecerão na sua página pública
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto de Perfil</label>
              <p className="text-xs text-muted-foreground mb-2">
                Resolução recomendada: 400x400px (formato quadrado)
              </p>
              <div className="flex items-center space-x-4">
                {form.watch('profile_avatar_url') && (
                  <img
                    src={form.watch('profile_avatar_url')}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file, 'avatar');
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {form.watch('profile_avatar_url') ? 'Alterar Foto' : 'Adicionar Foto'}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cover Photo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto de Capa</label>
              <p className="text-xs text-muted-foreground mb-2">
                Resolução recomendada: 1200x400px (formato retangular)
              </p>
              <div className="space-y-4">
                {form.watch('cover_photo_url') && (
                  <img
                    src={form.watch('cover_photo_url')}
                    alt="Capa"
                    className="w-full h-48 rounded-lg object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file, 'cover');
                    }}
                    className="hidden"
                    id="cover-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {form.watch('cover_photo_url') ? 'Alterar Capa' : 'Adicionar Capa'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle>Galeria de Fotos</CardTitle>
            <CardDescription>
              Fotos dos seus trabalhos que aparecerão na página pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'gallery');
                  }}
                  className="hidden"
                  id="gallery-upload"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('gallery-upload')?.click()}
                  disabled={uploadingGallery}
                >
                  {uploadingGallery ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Adicionar Foto
                </Button>
              </div>

              {/* Gallery Grid */}
              {galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Galeria"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteGalleryPhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma foto na galeria ainda</p>
                  <p className="text-sm">Adicione fotos dos seus trabalhos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Endereço e Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço e Localização
            </CardTitle>
            <CardDescription>
              Preencha o endereço da sua clínica e ajuste a localização no mapa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const formattedValue = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                            field.onChange(formattedValue);
                            
                            // Buscar endereço quando CEP estiver completo
                            if (value.length === 8) {
                              handleCepSearch(value);
                            }
                          }}
                          maxLength={9}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Cidade" 
                          {...field} 
                          disabled={addressFromCep}
                          className={addressFromCep ? "bg-gray-100" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Estado" 
                          {...field} 
                          disabled={addressFromCep}
                          className={addressFromCep ? "bg-gray-100" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddressSearch}
                    disabled={searchingAddress || !form.watch('street') || !form.watch('city')}
                    className="w-full"
                  >
                    {searchingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar no Mapa
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Form>

            {/* Mapa Interativo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Localização no Mapa</h3>
                <p className="text-sm text-muted-foreground">
                  Clique no mapa para ajustar a localização
                </p>
              </div>
              <InteractiveMap
                latitude={form.watch('latitude')}
                longitude={form.watch('longitude')}
                onLocationSelect={(lat, lng) => {
                  form.setValue('latitude', lat);
                  form.setValue('longitude', lng);
                  toast.success(`Localização definida: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Endereço e Localização
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImageFile(null);
        }}
        onCropComplete={handleCropComplete}
        imageFile={selectedImageFile}
        aspectRatio={cropType === 'avatar' ? 1 : 16/9}
        cropShape={cropType === 'avatar' ? 'round' : 'rect'}
      />
    </div>
  );
}