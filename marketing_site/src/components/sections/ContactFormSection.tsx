import React, { useState } from 'react';
import {
  Send,
  User,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { COMPANY_INFO } from '@/config/theme.config';

/**
 * Service options for the contact form
 */
const SERVICE_OPTIONS = [
  { value: '', label: 'Selecciona un servicio' },
  { value: 'iso-9001', label: 'ISO 9001 - Gestión de Calidad' },
  { value: 'iso-14001', label: 'ISO 14001 - Gestión Ambiental' },
  { value: 'iso-45001', label: 'ISO 45001 - Seguridad y Salud' },
  { value: 'sst', label: 'SG-SST - Sistema de Gestión SST' },
  { value: 'pesv', label: 'PESV - Plan Estratégico Seguridad Vial' },
  { value: 'consultoria', label: 'Consultoría Estratégica' },
  { value: 'plataforma', label: 'Plataforma de Gestión Integral' },
  { value: 'otro', label: 'Otro servicio' },
] as const;

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  servicio: string;
  mensaje: string;
}

const initialFormData: FormData = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  servicio: '',
  mensaje: '',
};

/**
 * ContactFormSection Component
 *
 * Professional contact form for scheduling meetings.
 * Sends data to WhatsApp for immediate response.
 */
export const ContactFormSection: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.empresa.trim()) {
      newErrors.empresa = 'La empresa es requerida';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    if (!formData.servicio) {
      newErrors.servicio = 'Selecciona un servicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Build WhatsApp message
    const serviceName = SERVICE_OPTIONS.find(s => s.value === formData.servicio)?.label || formData.servicio;

    const message = `*Nueva Solicitud de Reunión*

*Nombre:* ${formData.nombre}
*Empresa:* ${formData.empresa}
*Email:* ${formData.email}
*Teléfono:* ${formData.telefono}
*Servicio de Interés:* ${serviceName}
${formData.mensaje ? `*Mensaje:* ${formData.mensaje}` : ''}

_Enviado desde stratekaz.com_`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData(initialFormData);
      setIsSubmitted(false);
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <section className='py-section-sm lg:py-section-md'>
        <div className='container-responsive'>
          <div className='max-w-2xl mx-auto'>
            <div className='bg-black-card rounded-2xl border border-green-500/30 p-8 text-center'>
              <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='h-8 w-8 text-green-500' />
              </div>
              <h3 className='text-2xl font-bold text-white-text mb-2'>
                ¡Mensaje Enviado!
              </h3>
              <p className='text-white-muted'>
                Te responderemos lo más pronto posible. Revisa tu WhatsApp para continuar la conversación.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-section-sm lg:py-section-md'>
      <div className='container-responsive'>
        <div className='max-w-2xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <Calendar className='h-8 w-8 text-brand-500' />
              <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold text-white-text'>
                Agenda tu Reunión
              </h2>
            </div>
            <p className='text-lg text-white-muted'>
              Cuéntanos sobre tu empresa y te contactaremos para agendar una
              <span className='text-brand-400 font-medium'> reunión personalizada</span>
            </p>
          </div>

          {/* Value Proposition */}
          <div className='bg-black-card-soft rounded-xl p-4 mb-8 border border-black-border'>
            <div className='flex items-start gap-3'>
              <Sparkles className='h-5 w-5 text-brand-500 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm text-white-text font-medium mb-1'>
                  ¿Qué incluye la reunión?
                </p>
                <ul className='text-sm text-white-muted space-y-1'>
                  <li>• Diagnóstico inicial de tu situación actual</li>
                  <li>• Propuesta personalizada según tus necesidades</li>
                  <li>• Demostración de la Plataforma de Gestión Integral</li>
                  <li>• Sin compromiso - 100% gratuita</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='bg-black-card rounded-2xl border border-black-border p-6 lg:p-8 space-y-5'>
              {/* Nombre */}
              <div>
                <label htmlFor='nombre' className='block text-sm font-medium text-white-text mb-2'>
                  <User className='h-4 w-4 inline mr-2' />
                  Nombre completo *
                </label>
                <input
                  type='text'
                  id='nombre'
                  name='nombre'
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder='Tu nombre'
                  className={`w-full px-4 py-3 bg-black-hover border rounded-lg text-white-text placeholder-white-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                    errors.nombre ? 'border-red-500' : 'border-black-border'
                  }`}
                />
                {errors.nombre && (
                  <p className='text-red-400 text-sm mt-1'>{errors.nombre}</p>
                )}
              </div>

              {/* Empresa */}
              <div>
                <label htmlFor='empresa' className='block text-sm font-medium text-white-text mb-2'>
                  <Building2 className='h-4 w-4 inline mr-2' />
                  Empresa *
                </label>
                <input
                  type='text'
                  id='empresa'
                  name='empresa'
                  value={formData.empresa}
                  onChange={handleChange}
                  placeholder='Nombre de tu empresa'
                  className={`w-full px-4 py-3 bg-black-hover border rounded-lg text-white-text placeholder-white-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                    errors.empresa ? 'border-red-500' : 'border-black-border'
                  }`}
                />
                {errors.empresa && (
                  <p className='text-red-400 text-sm mt-1'>{errors.empresa}</p>
                )}
              </div>

              {/* Email y Teléfono - Grid */}
              <div className='grid sm:grid-cols-2 gap-5'>
                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-white-text mb-2'>
                    <Mail className='h-4 w-4 inline mr-2' />
                    Email *
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='tu@email.com'
                    className={`w-full px-4 py-3 bg-black-hover border rounded-lg text-white-text placeholder-white-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.email ? 'border-red-500' : 'border-black-border'
                    }`}
                  />
                  {errors.email && (
                    <p className='text-red-400 text-sm mt-1'>{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor='telefono' className='block text-sm font-medium text-white-text mb-2'>
                    <Phone className='h-4 w-4 inline mr-2' />
                    Teléfono *
                  </label>
                  <input
                    type='tel'
                    id='telefono'
                    name='telefono'
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder='+57 300 000 0000'
                    className={`w-full px-4 py-3 bg-black-hover border rounded-lg text-white-text placeholder-white-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.telefono ? 'border-red-500' : 'border-black-border'
                    }`}
                  />
                  {errors.telefono && (
                    <p className='text-red-400 text-sm mt-1'>{errors.telefono}</p>
                  )}
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label htmlFor='servicio' className='block text-sm font-medium text-white-text mb-2'>
                  Servicio de interés *
                </label>
                <select
                  id='servicio'
                  name='servicio'
                  value={formData.servicio}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black-hover border rounded-lg text-white-text focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                    errors.servicio ? 'border-red-500' : 'border-black-border'
                  } ${!formData.servicio ? 'text-white-muted/50' : ''}`}
                >
                  {SERVICE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.servicio && (
                  <p className='text-red-400 text-sm mt-1'>{errors.servicio}</p>
                )}
              </div>

              {/* Mensaje */}
              <div>
                <label htmlFor='mensaje' className='block text-sm font-medium text-white-text mb-2'>
                  <MessageSquare className='h-4 w-4 inline mr-2' />
                  Mensaje (opcional)
                </label>
                <textarea
                  id='mensaje'
                  name='mensaje'
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder='Cuéntanos más sobre tu proyecto o necesidades...'
                  rows={4}
                  className='w-full px-4 py-3 bg-black-hover border border-black-border rounded-lg text-white-text placeholder-white-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none'
                />
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className='h-5 w-5' />
                    Enviar y Agendar Reunión
                  </>
                )}
              </button>

              <p className='text-xs text-white-muted text-center'>
                Al enviar, serás redirigido a WhatsApp para confirmar tu solicitud.
                Responderemos en menos de 24 horas.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactFormSection;
