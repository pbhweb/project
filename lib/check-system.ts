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
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);
    
    if (profilesError) {
      issues.push(`❌ مشكلة في جدول profiles: ${profilesError.message}`);
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
