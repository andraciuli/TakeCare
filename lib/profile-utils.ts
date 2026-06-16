/**
 * Checks if a user's profile is complete enough to submit an adoption request.
 * Requires name, phone, and standard adoption survey answers (housing, household, activity).
 */
export function checkProfileCompleteness(profileData: {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  adoption_profile: any;
} | null): boolean {
  if (!profileData) return false;
  
  const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ');
  const hasBasicInfo = !!(fullName.trim() && profileData.phone && profileData.phone.trim());
  
  const hasAdoptionProfile = !!(
    profileData.adoption_profile &&
    typeof profileData.adoption_profile === 'object' &&
    profileData.adoption_profile.housing_type &&
    profileData.adoption_profile.household_members &&
    profileData.adoption_profile.physical_activity
  );
  
  return hasBasicInfo && hasAdoptionProfile;
}
