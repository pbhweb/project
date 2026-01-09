-- Insert sample categories (you can add more based on your needs)
-- Note: This is just for demonstration. In production, you might want a separate categories table

-- Sample data will be added after users sign up through the UI
-- This script is a placeholder for any seed data you might need

-- Create a function to validate content doesn't contain contact information
CREATE OR REPLACE FUNCTION validate_no_contact_info(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for phone numbers (various formats)
  IF content ~* '\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}|[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for email addresses
  IF content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for common messaging apps mentions
  IF content ~* '(whatsapp|telegram|signal|viber|skype|discord|slack|واتساب|تلجرام|سيجنال)' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for social media usernames
  IF content ~* '(@[a-zA-Z0-9_]+)|(facebook\.com|twitter\.com|instagram\.com|linkedin\.com)' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to projects description
ALTER TABLE public.projects
ADD CONSTRAINT check_project_description_no_contact 
CHECK (validate_no_contact_info(description));

-- Add constraint to bids proposal
ALTER TABLE public.bids
ADD CONSTRAINT check_bid_proposal_no_contact 
CHECK (validate_no_contact_info(proposal));

COMMENT ON FUNCTION validate_no_contact_info IS 'Validates that content does not contain contact information like phone numbers, emails, or social media handles';
