-- Controlla le policy attuali per la tabella predictions
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'predictions'
ORDER BY policyname;
