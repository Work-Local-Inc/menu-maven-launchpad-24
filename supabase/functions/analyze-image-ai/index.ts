import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, category, language } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create category-specific prompts
    const prompts = {
      en: {
        'popular-dishes': 'Analyze this food image and create an appetizing description for Milano Pizza Gatineau. Include visible ingredients, cooking style, and presentation. Make it SEO-friendly for a restaurant menu. Format: "Enjoy our [dish name]: [detailed description]. Perfect for [context], available for dine-in, takeout, or delivery in Gatineau."',
        'gallery': 'Describe this restaurant photo from Milano Pizza Gatineau focusing on ambiance, food presentation, or dining experience. Format: "Photo of [description] at Milano Pizza Gatineau."',
        'deals': 'Create a promotional description for this food/offer image at Milano Pizza Gatineau that emphasizes value and appeal. Format: "Special deal at Milano Pizza Gatineau: [description]. Limited time offer, available for dine-in, takeout, or delivery."',
        'menu': 'Analyze this menu image and create a descriptive caption. Format: "Complete Milano Pizza Gatineau menu 2024."'
      },
      fr: {
        'popular-dishes': 'Analysez cette image de plat et créez une description appétissante pour Milano Pizza Gatineau. Incluez les ingrédients visibles, le style de cuisson et la présentation. Rendez-la SEO pour un menu de restaurant. Format: "Savourez notre [nom du plat]: [description détaillée]. Parfait pour [contexte], disponible en salle, à emporter ou en livraison à Gatineau."',
        'gallery': 'Décrivez cette photo de restaurant de Milano Pizza Gatineau en mettant l\'accent sur l\'ambiance, la présentation des plats ou l\'expérience culinaire. Format: "Photo de [description] chez Milano Pizza Gatineau."',
        'deals': 'Créez une description promotionnelle pour cette image d\'offre/plat chez Milano Pizza Gatineau qui met l\'accent sur la valeur et l\'attrait. Format: "Offre spéciale chez Milano Pizza Gatineau: [description]. Promotion à durée limitée, disponible en salle, à emporter ou en livraison."',
        'menu': 'Analysez cette image de menu et créez une légende descriptive. Format: "Menu complet Milano Pizza Gatineau 2024."'
      }
    };

    const systemPrompt = `You are an expert food photographer and SEO content writer for Milano Pizza Gatineau, a restaurant in Gatineau, Quebec. Your task is to analyze food and restaurant images and generate compelling, SEO-optimized descriptions.

Key guidelines:
- Always mention Milano Pizza Gatineau naturally in the description
- Include location context (Gatineau) for local SEO
- Use appetizing, descriptive language for food items
- Identify specific ingredients and cooking methods visible
- Suggest realistic dish names based on what you see
- Keep descriptions natural and engaging, not keyword-stuffed
- Use the language specified (${language === 'fr' ? 'French' : 'English'})

Also provide:
1. A suggested dish/item name based on the image
2. A suggested category if none provided
3. The SEO-optimized description following the format template`;

    const userPrompt = category && prompts[language as keyof typeof prompts][category as keyof typeof prompts.en] 
      ? prompts[language as keyof typeof prompts][category as keyof typeof prompts.en]
      : `Analyze this image and provide an SEO-optimized description for Milano Pizza Gatineau in ${language === 'fr' ? 'French' : 'English'}.`;

    console.log('Analyzing image with OpenAI Vision API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${userPrompt}\n\nPlease respond with JSON format: {"dishName": "suggested dish name", "description": "SEO description", "suggestedCategory": "category if not provided"}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('AI response:', content);

    // Try to parse JSON response, fallback to text parsing
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Fallback: extract information from text response
      result = {
        dishName: 'AI-Generated Dish',
        description: content,
        suggestedCategory: category || 'popular-dishes'
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-image-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      dishName: '',
      description: '',
      suggestedCategory: 'popular-dishes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});