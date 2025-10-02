import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, MapPin, Camera, Trash2, Search, Link2, CheckCircle, XCircle, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { InteractiveMap } from '@/components/ui/map';
import { ImageCropModal } from '@/components/ui/image-crop-modal';

import { ProfileService } from '@/services/profileService';
import { PublicTreatmentsService } from '@/services/publicTreatmentsService';
import { WorkingHoursService, DAYS_OF_WEEK } from '@/services/workingHoursService';
import { ProceduresService } from '@/services/proceduresService';
import type { GalleryPhoto, PublicTreatment, WorkingHours, Procedure } from '@/types/database';
import { 
  validateUsername, 
  generateUsernameSuggestions,
  type UsernameAvailabilityResult 
} from '@/utils/usernameValidation';

const profileSchema = z.object({
  clinic_name: z.string().min(1, 'Nome da clínica é obrigatório'),
  username: z.string().optional(),
  about: z.string().optional(),
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
  
  // Username validation states
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailabilityResult | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Treatments states
  const [publicTreatments, setPublicTreatments] = useState<PublicTreatment[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [showImportTreatments, setShowImportTreatments] = useState(false);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);

  // Working hours states
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loadingWorkingHours, setLoadingWorkingHours] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      clinic_name: '',
      username: '',
      about: '',
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
    loadTreatments();
    loadWorkingHours();
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
          username: profileData.username || '',
          about: profileData.about || '',
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
        
        // Generate username suggestions if no username exists
        if (!profileData.username && profileData.clinic_name) {
          const suggestions = generateUsernameSuggestions(profileData.clinic_name);
          setUsernameSuggestions(suggestions);
        }
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

  // Load treatments
  const loadTreatments = async () => {
    try {
      const [treatmentsData, proceduresData] = await Promise.all([
        PublicTreatmentsService.getAll(),
        ProceduresService.getAll()
      ]);
      setPublicTreatments(treatmentsData);
      setProcedures(proceduresData);
    } catch (error) {
      console.error('Error loading treatments:', error);
      toast.error('Erro ao carregar tratamentos');
    }
  };

  // Load working hours
  const loadWorkingHours = async () => {
    try {
      const hoursData = await WorkingHoursService.getAll();
      setWorkingHours(hoursData);
    } catch (error) {
      console.error('Error loading working hours:', error);
      toast.error('Erro ao carregar horários de funcionamento');
    }
  };

  // Username validation function
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.trim() === '') {
      setUsernameAvailability(null);
      return;
    }

    const validation = validateUsername(username);
    if (!validation.isValid) {
      setUsernameAvailability({
        available: false,
        formatted_username: validation.formatted,
        message: validation.message
      });
      return;
    }

    try {
      setCheckingUsername(true);
      const result = await ProfileService.checkUsernameAvailability(validation.formatted);
      setUsernameAvailability(result);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailability({
        available: false,
        formatted_username: validation.formatted,
        message: 'Erro ao verificar disponibilidade'
      });
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle username change with debounce
  const handleUsernameChange = (value: string) => {
    form.setValue('username', value);
    
    // Clear previous availability check
    setUsernameAvailability(null);
    
    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle username suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('username', suggestion);
    checkUsernameAvailability(suggestion);
  };

  // Função para copiar URL do perfil
  const copyProfileUrl = (username: string) => {
    const url = `https://bio.estettica.com/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('URL copiada para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar URL');
    });
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
                {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle>Foto do Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
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
          </CardContent>
        </Card>

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

                {/* About Field */}
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobre você ou Sobre a clínica</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Exemplo: Especialista em estética facial e corporal. Transformando vidas através da beleza natural e do bem-estar."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Descreva sua especialidade, experiência ou o que torna sua clínica especial
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username do Perfil</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Input 
                              placeholder="minha-clinica" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleUsernameChange(e.target.value);
                              }}
                              className={
                                usernameAvailability?.available === false 
                                  ? 'border-red-500' 
                                  : usernameAvailability?.available === true 
                                  ? 'border-green-500' 
                                  : ''
                              }
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {checkingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                              {!checkingUsername && usernameAvailability?.available === true && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {!checkingUsername && usernameAvailability?.available === false && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          
                          {/* URL Preview */}
                          {field.value && (
                            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                <span>bio.estettica.com/{field.value}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyProfileUrl(field.value || '')}
                                className="h-6 w-6 p-0 hover:bg-gray-200"
                                title="Copiar URL"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Validation Message */}
                          {usernameAvailability?.message && (
                            <p className={`text-sm ${
                              usernameAvailability.available ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {usernameAvailability.message}
                            </p>
                          )}
                          
                          {/* Username Suggestions */}
                          {usernameSuggestions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Sugestões:</p>
                              <div className="flex flex-wrap gap-2">
                                {usernameSuggestions.map((suggestion) => (
                                  <Button
                                    key={suggestion}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-xs"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Este será o link público do seu perfil. Use apenas letras, números e hífens.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

        {/* Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle>Galeria de Fotos</CardTitle>
            <CardDescription>
              Fotos dos seus trabalhos que aparecerão na página pública (máximo 6 fotos)
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
                    if (file) {
                      if (galleryPhotos.length >= 6) {
                        toast.error('Máximo de 6 fotos permitido na galeria');
                        return;
                      }
                      handleImageUpload(file, 'gallery');
                    }
                  }}
                  className="hidden"
                  id="gallery-upload"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (galleryPhotos.length >= 6) {
                      toast.error('Máximo de 6 fotos permitido na galeria');
                      return;
                    }
                    document.getElementById('gallery-upload')?.click();
                  }}
                  disabled={uploadingGallery || galleryPhotos.length >= 6}
                >
                  {uploadingGallery ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {galleryPhotos.length >= 6 ? 'Limite atingido (6/6)' : `Adicionar Foto (${galleryPhotos.length}/6)`}
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
                  <p className="text-sm">Adicione fotos dos seus trabalhos (máximo 6)</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tratamentos Públicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Tratamentos e Serviços
            </CardTitle>
            <CardDescription>
              Adicione os tratamentos que aparecerão no seu perfil público (máximo 10 tratamentos)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lista de tratamentos */}
            <div className="space-y-4">
              {publicTreatments.length > 0 ? (
                <div className="space-y-3">
                  {publicTreatments.map((treatment, index) => (
                    <div key={treatment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{treatment.name}</h4>
                        {treatment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{treatment.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await PublicTreatmentsService.delete(treatment.id);
                              toast.success('Tratamento removido');
                              loadTreatments();
                            } catch (error) {
                              toast.error('Erro ao remover tratamento');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum tratamento adicionado ainda</p>
                  <p className="text-sm">Adicione tratamentos que aparecerão no seu perfil (máximo 10)</p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (publicTreatments.length >= 10) {
                    toast.error('Máximo de 10 tratamentos permitido');
                    return;
                  }
                  setShowImportTreatments(!showImportTreatments);
                }}
                variant="outline"
                disabled={procedures.length === 0 || publicTreatments.length >= 10}
              >
                {showImportTreatments ? 'Cancelar Importação' : 
                 publicTreatments.length >= 10 ? 'Limite atingido (10/10)' : 
                 `Importar dos Procedimentos (${publicTreatments.length}/10)`}
              </Button>
            </div>

            {/* Modal de importação */}
            {showImportTreatments && (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Selecione os procedimentos para importar:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {procedures.map((procedure) => (
                    <label key={procedure.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedProcedures.includes(procedure.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newTotal = publicTreatments.length + selectedProcedures.length + 1;
                            if (newTotal > 10) {
                              toast.error('Máximo de 10 tratamentos permitido');
                              return;
                            }
                            setSelectedProcedures([...selectedProcedures, procedure.id]);
                          } else {
                            setSelectedProcedures(selectedProcedures.filter(id => id !== procedure.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{procedure.name}</span>
                        {procedure.description && (
                          <p className="text-sm text-muted-foreground">{procedure.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (selectedProcedures.length === 0) {
                        toast.error('Selecione pelo menos um procedimento');
                        return;
                      }
                      
                      const newTotal = publicTreatments.length + selectedProcedures.length;
                      if (newTotal > 10) {
                        toast.error('Máximo de 10 tratamentos permitido');
                        return;
                      }
                      
                      try {
                        setLoadingTreatments(true);
                        await PublicTreatmentsService.importFromProcedures(selectedProcedures);
                        toast.success(`${selectedProcedures.length} tratamento(s) importado(s) com sucesso!`);
                        setSelectedProcedures([]);
                        setShowImportTreatments(false);
                        loadTreatments();
                      } catch (error) {
                        toast.error('Erro ao importar tratamentos');
                      } finally {
                        setLoadingTreatments(false);
                      }
                    }}
                    disabled={selectedProcedures.length === 0 || loadingTreatments}
                  >
                    {loadingTreatments && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Importar Selecionados ({selectedProcedures.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportTreatments(false);
                      setSelectedProcedures([]);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horários de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Horários de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure os horários de funcionamento da sua clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = workingHours.find(h => h.day_of_week === day.value);
                return (
                  <div key={day.value} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-32">
                      <span className="font-medium">{day.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dayHours?.is_open || false}
                        onChange={async (e) => {
                          try {
                            setLoadingWorkingHours(true);
                            if (dayHours) {
                              await WorkingHoursService.updateDay(day.value, {
                                is_open: e.target.checked,
                                open_time: e.target.checked ? (dayHours.open_time || '09:00') : undefined,
                                close_time: e.target.checked ? (dayHours.close_time || '18:00') : undefined
                              });
                            } else {
                              await WorkingHoursService.upsert([{
                                day_of_week: day.value,
                                is_open: e.target.checked,
                                open_time: e.target.checked ? '09:00' : undefined,
                                close_time: e.target.checked ? '18:00' : undefined
                              }]);
                            }
                            loadWorkingHours();
                            toast.success(`Horário de ${day.label} atualizado com sucesso!`);
                          } catch (error) {
                            toast.error('Erro ao atualizar horário');
                          } finally {
                            setLoadingWorkingHours(false);
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Aberto</span>
                    </div>
                    {dayHours?.is_open && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dayHours.open_time || '09:00'}
                          onChange={async (e) => {
                            try {
                              await WorkingHoursService.updateDay(day.value, {
                                open_time: e.target.value
                              });
                              loadWorkingHours();
                              toast.success(`Horário de abertura de ${day.label} atualizado!`);
                            } catch (error) {
                              toast.error('Erro ao atualizar horário');
                            }
                          }}
                          className="w-24"
                        />
                        <span className="text-sm">às</span>
                        <Input
                          type="time"
                          value={dayHours.close_time || '18:00'}
                          onChange={async (e) => {
                            try {
                              await WorkingHoursService.updateDay(day.value, {
                                close_time: e.target.value
                              });
                              loadWorkingHours();
                              toast.success(`Horário de fechamento de ${day.label} atualizado!`);
                            } catch (error) {
                              toast.error('Erro ao atualizar horário');
                            }
                          }}
                          className="w-24"
                        />
                      </div>
                    )}
                    {!dayHours?.is_open && (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setLoadingWorkingHours(true);
                    await WorkingHoursService.createDefault();
                    toast.success('Horários padrão criados');
                    loadWorkingHours();
                  } catch (error) {
                    toast.error('Erro ao criar horários padrão');
                  } finally {
                    setLoadingWorkingHours(false);
                  }
                }}
                disabled={loadingWorkingHours}
              >
                {loadingWorkingHours && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Definir Horários Padrão
              </Button>
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