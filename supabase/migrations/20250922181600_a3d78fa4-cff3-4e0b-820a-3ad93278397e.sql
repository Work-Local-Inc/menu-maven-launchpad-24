-- Create restaurant_menus table for multiple menu support
CREATE TABLE public.restaurant_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_submission_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'custom')),
  custom_category_name TEXT,
  menu_name TEXT NOT NULL,
  menu_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view restaurant menus" 
ON public.restaurant_menus 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert restaurant menus" 
ON public.restaurant_menus 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can update restaurant menus" 
ON public.restaurant_menus 
FOR UPDATE 
USING (false);

CREATE POLICY "Only admins can delete restaurant menus" 
ON public.restaurant_menus 
FOR DELETE 
USING (false);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_menus_updated_at
BEFORE UPDATE ON public.restaurant_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to ensure custom_category_name is provided when category is 'custom'
ALTER TABLE public.restaurant_menus 
ADD CONSTRAINT check_custom_category_name 
CHECK (
  (category != 'custom') OR 
  (category = 'custom' AND custom_category_name IS NOT NULL AND custom_category_name != '')
);