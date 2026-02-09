import React from 'react';
import {
    Car,
    Users,
    GraduationCap,
    Utensils,
    Beef,
    PiggyBank,
    Palmtree,
    Tractor,
    Wrench,
} from 'lucide-react';

interface ClientLogo {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

const clients: ClientLogo[] = [
    // 1. Radio Taxi Cone Ltda (Rojo)
    { id: '14', name: 'Radio Taxi Cone Ltda', icon: Car, color: 'text-red-600' },

    // 2. Grasas y Huesos del Norte S.A.S (Azul)
    { id: '1', name: 'Grasas y Huesos del Norte S.A.S', icon: Beef, color: 'text-blue-600' },

    // 3. Fomanort (Naranja)
    { id: '9', name: 'Fomanort', icon: Users, color: 'text-orange-500' },

    // 4. Caja Union (Verde)
    { id: '4', name: 'Caja Union', icon: PiggyBank, color: 'text-green-600' },

    // 5. Palnorte S.A.S (Verde)
    { id: '2', name: 'Palnorte S.A.S.', icon: Palmtree, color: 'text-green-600' },

    // 6. Oleonorte S.A.S (Verde)
    { id: '3', name: 'Oleo Norte S.A.S', icon: Palmtree, color: 'text-green-600' },

    // 7. Universidad Simon Bolivar (Verde)
    { id: '5', name: 'Universidad Simon Bolivar', icon: GraduationCap, color: 'text-green-600' },

    // 8. Grupo Empresarial Old West Food S.A.S (Rojo)
    { id: '7', name: 'Grupo Empresarial Old West Food S.A.S', icon: Utensils, color: 'text-red-600' },

    // 9. Vidales Food S.A.S (Cafe -> Amber-800)
    { id: '6', name: 'Vidales Food S.A.S', icon: Utensils, color: 'text-amber-800' },

    // 10. Mustafa Food S.A.S (Amarillo)
    { id: '8', name: 'Mustafa Food S.A.S', icon: Utensils, color: 'text-yellow-500' },

    // 11. Freno Motors S.A.S (Azul)
    { id: '10', name: 'Freno Motors S.A.S', icon: Wrench, color: 'text-blue-600' },

    // 12. Mundo Korea S.A.S (Rojo)
    { id: '11', name: 'Mundo Korea S.A.S', icon: Wrench, color: 'text-red-600' },

    // 13. Procesant S.A.S (Verde)
    { id: '12', name: 'Procesant S.A.S', icon: Beef, color: 'text-green-600' },

    // 14. Soagro SM S.A.S (Verde)
    { id: '13', name: 'Soagro SM S.A.S', icon: Tractor, color: 'text-green-600' },
];

export const TrustedBySection: React.FC = () => {
    return (
        <section className='py-section-sm'>
            <div className='container-responsive'>
                <div className='text-center mb-8 lg:mb-12'>
                    <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold font-title text-white-text mb-4'>
                        Nuestros Aliados
                    </h2>
                    <div className='container-content'>
                        <p className='text-xl text-white-muted'>
                            Empresas líderes que confían en nuestra diversidad de servicios
                        </p>
                    </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch justify-items-center'>
                    {clients.map((client) => {
                        const Icon = client.icon;
                        return (
                            <div
                                key={client.id}
                                className='group flex flex-col items-center justify-center w-full'
                            >
                                <div className='relative w-full h-full p-6 rounded-xl bg-black-card-soft border border-black-border-soft hover:border-neutral-600 transition-all duration-300 hover:bg-black-hover-soft hover:scale-105 hover:shadow-medium flex flex-col items-center gap-4 cursor-default'>
                                    {/* Icon Container */}
                                    <div className='p-3 rounded-lg bg-black-deep/50 group-hover:bg-black-deep transition-colors duration-300'>
                                        <Icon
                                            className={`h-8 w-8 lg:h-10 lg:w-10 transition-all duration-300 
                                        opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 
                                        ${client.color}`}
                                        />
                                    </div>

                                    {/* Company Name */}
                                    <span className='text-sm font-medium text-white-muted group-hover:text-white-text transition-colors duration-300 text-center leading-tight'>
                                        {client.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
