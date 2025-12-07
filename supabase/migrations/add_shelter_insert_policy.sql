-- Add INSERT policy for shelters table
-- This allows authenticated users to create shelters where they are the admin

CREATE POLICY "Users can create shelters as admin" ON public.shelters
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- Add UPDATE policy so admins can edit their own shelters
CREATE POLICY "Admins can update their own shelters" ON public.shelters
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Add DELETE policy so admins can delete their own shelters
CREATE POLICY "Admins can delete their own shelters" ON public.shelters
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid());
