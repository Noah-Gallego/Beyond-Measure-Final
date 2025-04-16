'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // To show success/error messages
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Track field validity and touched state
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
    message: false
  });

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (status && showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, showNotification]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(''); // Clear previous status
    setShowNotification(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(data.message || 'Your message has been sent. Check your inbox for a confirmation email.');
        // Clear form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        // Reset touched state
        setTouched({
          name: false,
          email: false,
          subject: false,
          message: false
        });
      } else {
        setStatus(`Error: ${data.message || 'Failed to send message.'}`);
      }
      setShowNotification(true);
    } catch (error) {
      console.error('Contact form submission error:', error);
      setStatus('Error: An unexpected error occurred.');
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark field as touched on blur
  const handleBlur = (field: 'name' | 'email' | 'subject' | 'message') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Get input class based on validation state
  const getInputClass = (field: 'name' | 'email' | 'subject' | 'message', value: string) => {
    if (!touched[field]) {
      return "";
    }
    return value.trim() === '' ? "border-red-500 focus:ring-red-500" : "border-green-500 focus:ring-green-500";
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {showNotification && status && (
          <div 
            className={`mb-6 p-4 rounded-lg ${
              status.startsWith('Error') 
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30' 
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {status.startsWith('Error') ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  status.startsWith('Error') 
                    ? 'text-red-800 dark:text-red-200' 
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {status}
                </p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-[#0E5D7F] mb-2">Send Us a Message</h2>
        <p className="text-muted-foreground mb-6">
          Have questions about Beyond Measure? We'd love to hear from you!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
              {touched.name && name.trim() === '' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                className={getInputClass('name', name)}
                placeholder="Your Name"
              />
              {touched.name && name.trim() !== '' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
              {touched.email && email.trim() === '' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={getInputClass('email', email)}
                placeholder="you@example.com"
              />
              {touched.email && email.trim() !== '' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
              {touched.subject && subject.trim() === '' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                type="text"
                name="subject"
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onBlur={() => handleBlur('subject')}
                className={getInputClass('subject', subject)}
                placeholder="Reason for contacting us"
              />
              {touched.subject && subject.trim() !== '' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message
              {touched.message && message.trim() === '' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <div className="relative">
              <Textarea
                id="message"
                name="message"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => handleBlur('message')}
                className={getInputClass('message', message)}
                placeholder="Your message here..."
              />
              {touched.message && message.trim() !== '' && (
                <div className="absolute top-3 right-0 flex items-start pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0E5D7F] hover:bg-[#0E5D7F]/90 text-white font-semibold py-2 px-4 rounded-md"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </div>
              ) : (
                <span>Send Message</span>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-[#0E5D7F]">Contact Information</h3>
            <div className="space-y-3">
              <p className="flex items-center text-muted-foreground">
                <Mail className="h-5 w-5 mr-3 text-[#3AB5E9]" />
                <span>support@gobeyondmeasure.org</span>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 