//https://developers.google.com/workspace/guides/get-started
//enable Google Forms api then follow instructions to get credentials

import { IGoogleCredentials } from '#sern/ext';

export const GoogleCredentials = {
  type: '', //Should be service account
  project_id: '',
  private_key_id: '',
  private_key: '',
  client_email: '',
  client_id: '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: '',
  universe_domain: 'googleapis.com'
} as IGoogleCredentials;
