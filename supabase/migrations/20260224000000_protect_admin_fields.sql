-- Add is_admin, suspended, identity_verified, admin_notes to protected fields
-- These were missing from the initial column protection trigger
CREATE OR REPLACE FUNCTION prevent_profile_sensitive_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    NEW.is_verified := OLD.is_verified;
    NEW.user_type := OLD.user_type;
    NEW.billing_type := OLD.billing_type;
    NEW.payment_method := OLD.payment_method;
    NEW.po_number := OLD.po_number;
    NEW.referral_code := OLD.referral_code;
    NEW.email := OLD.email;
    NEW.deleted_at := OLD.deleted_at;
    NEW.is_admin := OLD.is_admin;
    NEW.suspended := OLD.suspended;
    NEW.identity_verified := OLD.identity_verified;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
