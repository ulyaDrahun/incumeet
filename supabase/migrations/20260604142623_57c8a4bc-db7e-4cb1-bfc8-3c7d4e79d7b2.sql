-- Revoke execute on SECURITY DEFINER trigger functions from clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Disable GraphQL API exposure (app uses PostgREST/REST, not GraphQL)
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION graphql_public.graphql FROM anon, authenticated;
