// Utility functions for SEO-friendly filename handling

export const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Only allow letters, numbers, spaces, hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const generateSEOFilename = (dishName: string, category: string, restaurant: string = 'milano'): string => {
  const cleanDishName = sanitizeFilename(dishName);
  const cleanCategory = sanitizeFilename(category);
  
  switch (cleanCategory) {
    case 'popular-dishes':
      return `${cleanDishName}-${restaurant}.webp`;
    case 'gallery':
      return `${restaurant}-${cleanDishName}.webp`;
    case 'deals':
      return `${cleanDishName}-deal-${restaurant}.webp`;
    case 'menu':
      return `menu-${restaurant}-${new Date().getFullYear()}.webp`;
    default:
      return `${cleanDishName}-${restaurant}.webp`;
  }
};

export const getCategorySuggestions = (category: string): string[] => {
  const suggestions = {
    'popular-dishes': [
      'poutine-poulet-buffalo',
      'sous-marin-steak-philly',
      'pizza-special-milano',
      'penne-poulet-alfredo',
      'ailes-de-poulet'
    ],
    'gallery': [
      'restaurant-interieur',
      'cuisine-milano',
      'salle-manger',
      'terrasse',
      'equipe-milano'
    ],
    'deals': [
      'pizza-special-deal',
      'combo-meal-deal',
      'family-pack-deal'
    ],
    'menu': [
      'menu-complet',
      'carte-plats',
      'menu-principal'
    ]
  };
  
  return suggestions[category as keyof typeof suggestions] || [];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};