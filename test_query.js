// Test query to run in browser console
// This will help diagnose if the issue is with RLS policies or the query itself

// 1. First, check the current session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
console.log('Current session:', {
    userId: session?.user?.id,
    email: session?.user?.email,
    error: sessionError
});

// 2. Try to fetch call_metrics for the current user
const { data, error, status, statusText } = await supabase
    .from('call_metrics')
    .select('*')
    .eq('user_id', session?.user?.id);

console.log('Query result:', {
    data,
    error,
    status,
    statusText,
    rowCount: data?.length
});

// 3. Try without the .eq filter to see if RLS is working at all
const { data: allData, error: allError } = await supabase
    .from('call_metrics')
    .select('*');

console.log('Query without filter:', {
    data: allData,
    error: allError,
    rowCount: allData?.length
});

// 4. Check if the user can read their own profile (to verify RLS is working)
const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session?.user?.id)
    .single();

console.log('Profile query:', {
    data: profileData,
    error: profileError
});
