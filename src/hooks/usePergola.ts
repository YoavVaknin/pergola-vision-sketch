
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PergolaDesign {
  id?: string;
  width: number;
  height: number;
  profile_frame: string;
  profile_division: string;
  profile_shading: string;
  beam_spacing: number;
  beam_direction: number;
  created_by?: string;
  created_at?: string;
}

export const usePergola = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // שמירת הדמיה חדשה
  const saveDesign = useMutation({
    mutationFn: async (design: Omit<PergolaDesign, 'id' | 'created_by' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('המשתמש לא מחובר');
      }

      const { data, error } = await supabase
        .from('pergola_designs')
        .insert({
          ...design,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "נשמר בהצלחה! ✅",
        description: "ההדמיה נשמרה במאגר הנתונים",
      });
      queryClient.invalidateQueries({ queryKey: ['pergola-designs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשמירה ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // טעינת כל ההדמיות של המשתמש
  const getMyDesigns = useQuery({
    queryKey: ['pergola-designs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pergola_designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    saveDesign,
    getMyDesigns,
  };
};
