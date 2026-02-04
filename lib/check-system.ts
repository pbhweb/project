// lib/check-system.ts
import { createClient } from '@/lib/supabase/client';

export async function checkSystemHealth() {
  const supabase = createClient();
  const issues: string[] = [];
  
  try {
    // التحقق من اتصال Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) issues.push(`❌ مشكلة في المصادقة: ${authError.message}`);
    
    // التحقق من جدول profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (profilesError) {
      issues.push(`❌ مشكلة في جدول profiles: ${profilesError.message}`);
    } else {
      // التحقق إذا كان حقل email موجود
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        if (!profile.email) {
          issues.push(`⚠️ حقل email مفقود في جدول profiles`);
        }
      }
    }
    
    // التحقق من جدول affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('id, referral_code')
      .limit(1);
    
    if (affiliatesError) {
      issues.push(`❌ مشكلة في جدول affiliates: ${affiliatesError.message}`);
    }
    
    // التحقق من جدول referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id')
      .limit(1);
    
    if (referralsError) {
      issues.push(`❌ مشكلة في جدول referrals: ${referralsError.message}`);
    }
    
    // التحقق من جدول projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
    
    if (projectsError) {
      issues.push(`❌ مشكلة في جدول projects: ${projectsError.message}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      healthy: false,
      issues: [`❌ خطأ عام: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}
