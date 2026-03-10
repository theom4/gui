-- Insert test data for call_metrics
-- Replace the user_id with your actual user ID from the logs

INSERT INTO public.call_metrics (
    user_id,
    total_apeluri,
    apeluri_initiate,
    apeluri_primite,
    rata_conversie,
    minute_consumate
) VALUES (
    'e69c35d9-f5e8-45de-8b71-fbde02efbb45',
    150,
    85,
    65,
    42.5,
    320
);

-- Verify the insert
SELECT * FROM public.call_metrics WHERE user_id = 'e69c35d9-f5e8-45de-8b71-fbde02efbb45';
