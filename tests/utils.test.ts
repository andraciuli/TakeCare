import { getUserDisplayName } from '@/lib/userUtils';
import { checkProfileCompleteness } from '@/lib/profile-utils';
import { validateVisitDate } from '@/lib/timeUtils';

describe('User Display Name formatting (getUserDisplayName)', () => {
  test('should return full name if both first name and last name exist', () => {
    const user = { first_name: 'Andra', last_name: 'Ciuli', email: 'andra@example.com' };
    expect(getUserDisplayName(user)).toBe('Andra Ciuli');
  });

  test('should return only first name if last name is missing', () => {
    const user = { first_name: 'Andra', last_name: null, email: 'andra@example.com' };
    expect(getUserDisplayName(user)).toBe('Andra');
  });

  test('should return email prefix if names are missing', () => {
    const user = { first_name: null, last_name: null, email: 'andra.ciuli@example.com' };
    expect(getUserDisplayName(user)).toBe('andra.ciuli');
  });
});

describe('Adoption Profile Completeness (checkProfileCompleteness)', () => {
  test('should return true if name, phone, and complete adoption survey answers are provided', () => {
    const profile = {
      first_name: 'Andra',
      last_name: 'Ciuli',
      phone: '0712345678',
      adoption_profile: {
        housing_type: 'Apartment',
        household_members: '2 adults',
        physical_activity: 'Moderate'
      }
    };
    expect(checkProfileCompleteness(profile)).toBe(true);
  });

  test('should return false if phone number is missing or empty', () => {
    const profile = {
      first_name: 'Andra',
      last_name: 'Ciuli',
      phone: '',
      adoption_profile: {
        housing_type: 'Apartment',
        household_members: '2 adults',
        physical_activity: 'Moderate'
      }
    };
    expect(checkProfileCompleteness(profile)).toBe(false);
  });

  test('should return false if profile data is null or undefined', () => {
    expect(checkProfileCompleteness(null)).toBe(false);
  });

  test('should return false if critical survey answers are missing', () => {
    const profile = {
      first_name: 'Andra',
      last_name: 'Ciuli',
      phone: '0712345678',
      adoption_profile: {
        housing_type: 'Apartment'
        // household_members and physical_activity missing
      }
    };
    expect(checkProfileCompleteness(profile)).toBe(false);
  });
});

describe('Visit Date Validation (validateVisitDate)', () => {
  test('should return invalid if date string is empty', () => {
    const result = validateVisitDate('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Te rugăm să selectezi o dată');
  });

  test('should return invalid if date is in the past or less than 24 hours in the future', () => {
    const now = new Date();
    // 5 hours in the future
    const soonStr = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
    const result = validateVisitDate(soonStr);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cu cel puțin 24 de ore în avans');
  });

  test('should return invalid if time is outside visiting hours (09:00 - 18:00)', () => {
    // 2 days in the future at 08:00 AM
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(8, 0, 0, 0); // 8:00 AM
    const result = validateVisitDate(date.toISOString());
    expect(result.valid).toBe(false);
    expect(result.error).toContain('intervalul de funcționare (09:00 - 18:00)');
  });

  test('should return valid if date is 2 days in the future and during visiting hours', () => {
    // 2 days in the future at 10:00 AM
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(10, 0, 0, 0); // 10:00 AM
    const result = validateVisitDate(date.toISOString());
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
