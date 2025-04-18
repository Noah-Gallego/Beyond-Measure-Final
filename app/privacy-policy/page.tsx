import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Beyond Measure',
  description: 'Privacy Policy for Beyond Measure. Learn about how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-gray-600 mb-6">Effective date: September 23, 2019</p>

      <p className="mb-4">
        Seedcore Foundation dba Beyond Measure ("us", "we", or "our") operates the{' '}
        <Link href="/" className="text-blue-600 hover:underline">gobeyondmeasure.org</Link> website (hereinafter referred to as the "Service").
      </p>

      <p className="mb-4">
        This page informs you of our policies regarding the collection, use and disclosure of personal data when you use our Service and
        the choices you have associated with that data.
      </p>

      <p className="mb-6">
        We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in
        accordance with this policy. Unless otherwise defined in this Privacy Policy, the terms used in this Privacy Policy have the same
        meanings as in our Terms and Conditions, accessible from{' '}
        <Link href="/terms-of-use" className="text-blue-600 hover:underline">gobeyondmeasure.org</Link>
      </p>

      <h2 className="text-2xl font-semibold mb-3">Definitions</h2>
      <ul className="list-disc list-inside ml-4 mb-6 space-y-2">
        <li>
          <strong>Service:</strong> Service is the{' '}
          <Link href="/" className="text-blue-600 hover:underline">gobeyondmeasure.org</Link> website operated by Seedcore Foundation dba Beyond Measure
        </li>
        <li>
          <strong>Personal Data:</strong> Personal Data means data about a living individual who can be identified from those data (or
          from those and other information either in our possession or likely to come into our possession).
        </li>
        <li>
          <strong>Usage Data:</strong> Usage Data is data collected automatically either generated by the use of the Service or from the
          Service infrastructure itself (for example, the duration of a page visit).
        </li>
        <li>
          <strong>Cookies:</strong> Cookies are small files stored on your device (computer or mobile device).
        </li>
        <li>
          <strong>Data Controller:</strong> Data Controller means the natural or legal person who (either alone or jointly or in common
          with other persons) determines the purposes for which and the manner in which any personal information are, or are to be,
          processed. For the purpose of this Privacy Policy, we are a Data Controller of your Personal Data.
        </li>
        <li>
          <strong>Data Processors (or Service Providers):</strong> Data Processor (or Service Provider) means any natural or legal
          person who processes the data on behalf of the Data Controller. We may use the services of various Service Providers in order
          to process your data more effectively.
        </li>
        <li>
          <strong>Data Subject (or User):</strong> Data Subject is any living individual who is using our Service and is the subject of
          Personal Data.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-3">Information Collection and Use</h2>
      <p className="mb-4">
        We collect several different types of information for various purposes to provide and improve our Service to you.
      </p>

      <h3 className="text-xl font-semibold mb-3">Types of Data Collected</h3>

      <h4 className="text-lg font-semibold mb-2">Personal Data</h4>
      <p className="mb-4">
        While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact
        or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:
      </p>
      <ul className="list-disc list-inside ml-4 mb-4">
        <li>Email address</li>
        <li>First name and last name</li>
        <li>Phone number</li>
        <li>Address, State, Province, ZIP/Postal code, City</li>
        <li>Cookies and Usage Data</li>
      </ul>
      <p className="mb-4">
        We may use your Personal Data to contact you with newsletters, marketing or promotional materials and other information that may be
        of interest to you. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or
        the instructions provided in any email we send.
      </p>

      <h4 className="text-lg font-semibold mb-2">Usage Data</h4>
      <p className="mb-4">
        We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information
        such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that
        you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
      </p>

      <h4 className="text-lg font-semibold mb-2">Tracking & Cookies Data</h4>
      <p className="mb-4">
        We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information.
      </p>
      <p className="mb-4">
        Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser
        from a website and stored on your device. Other tracking technologies are also used such as beacons, tags and scripts to collect
        and track information and to improve and analyse our Service.
      </p>
      <p className="mb-4">
        You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept
        cookies, you may not be able to use some portions of our Service.
      </p>
      <p className="mb-6">Examples of Cookies we use:</p>
      <ul className="list-disc list-inside ml-4 mb-6">
        <li><strong>Session Cookies.</strong> We use Session Cookies to operate our Service.</li>
        <li><strong>Preference Cookies.</strong> We use Preference Cookies to remember your preferences and various settings.</li>
        <li><strong>Security Cookies.</strong> We use Security Cookies for security purposes.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-3">Use of Data</h2>
      <p className="mb-4">Seedcore Foundation dba Beyond Measure uses the collected data for various purposes:</p>
      <ul className="list-disc list-inside ml-4 mb-6 space-y-1">
        <li>To provide and maintain our Service</li>
        <li>To notify you about changes to our Service</li>
        <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
        <li>To provide customer support</li>
        <li>To gather analysis or valuable information so that we can improve our Service</li>
        <li>To monitor the usage of our Service</li>
        <li>To detect, prevent and address technical issues</li>
        <li>
          To provide you with news, special offers and general information about other goods, services and events which we offer that are
          similar to those that you have already purchased or enquired about unless you have opted not to receive such information
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-3">Legal Basis for Processing Personal Data under the General Data Protection Regulation (GDPR)</h2>
      <p className="mb-4">
        If you are from the European Economic Area (EEA), Seedcore Foundation dba Beyond Measure legal basis for collecting and using the
        personal information described in this Privacy Policy depends on the Personal Data we collect and the specific context in which we
        collect it.
      </p>
      <p className="mb-4">Seedcore Foundation dba Beyond Measure may process your Personal Data because:</p>
      <ul className="list-disc list-inside ml-4 mb-6 space-y-1">
        <li>We need to perform a contract with you</li>
        <li>You have given us permission to do so</li>
        <li>The processing is in our legitimate interests and it is not overridden by your rights</li>
        <li>For payment processing purposes</li>
        <li>To comply with the law</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-3">Retention of Data</h2>
      <p className="mb-4">
        Seedcore Foundation dba Beyond Measure will retain your Personal Data only for as long as is necessary for the purposes set out in
        this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for
        example, if we are required to retain your data to comply with applicable laws), resolve disputes and enforce our legal agreements
        and policies.
      </p>
      <p className="mb-6">
        Seedcore Foundation dba Beyond Measure will also retain Usage Data for internal analysis purposes. Usage Data is generally retained
        for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of our
        Service, or we are legally obligated to retain this data for longer periods.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Transfer of Data</h2>
      <p className="mb-4">
        Your information, including Personal Data, may be transferred to - and maintained on - computers located outside of your state,
        province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.
      </p>
      <p className="mb-4">
        If you are located outside United States and choose to provide information to us, please note that we transfer the data, including
        Personal Data, to United States and process it there.
      </p>
      <p className="mb-4">
        Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
      </p>
      <p className="mb-6">
        Seedcore Foundation dba Beyond Measure will take all the steps reasonably necessary to ensure that your data is treated securely
        and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organisation or a country
        unless there are adequate controls in place including the security of your data and other personal information.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Disclosure of Data</h2>
      <h3 className="text-xl font-semibold mb-2">Disclosure for Law Enforcement</h3>
      <p className="mb-4">
        Under certain circumstances, Seedcore Foundation dba Beyond Measure may be required to disclose your Personal Data if required to do
        so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
      </p>
      <h3 className="text-xl font-semibold mb-2">Legal Requirements</h3>
      <p className="mb-4">
        Seedcore Foundation dba Beyond Measure may disclose your Personal Data in the good faith belief that such action is necessary to:
      </p>
      <ul className="list-disc list-inside ml-4 mb-6 space-y-1">
        <li>To comply with a legal obligation</li>
        <li>To protect and defend the rights or property of Seedcore Foundation dba Beyond Measure</li>
        <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
        <li>To protect the personal safety of users of the Service or the public</li>
        <li>To protect against legal liability</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-3">Security of Data</h2>
      <p className="mb-6">
        The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic
        storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee
        its absolute security.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Our Policy on "Do Not Track" Signals under the California Online Protection Act (CalOPPA)</h2>
      <p className="mb-4">
        We do not support Do Not Track ("DNT"). Do Not Track is a preference you can set in your web browser to inform websites that you do
        not want to be tracked.
      </p>
      <p className="mb-6">
        You can enable or disable Do Not Track by visiting the Preferences or Settings page of your web browser.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Your Data Protection Rights under the General Data Protection Regulation (GDPR)</h2>
      <p className="mb-4">
        If you are a resident of the European Economic Area (EEA), you have certain data protection rights. Seedcore Foundation dba Beyond
        Measure aims to take reasonable steps to allow you to correct, amend, delete or limit the use of your Personal Data.
      </p>
      <p className="mb-4">
        If you wish to be informed about what Personal Data we hold about you and if you want it to be removed from our systems, please
        contact us.
      </p>
      <p className="mb-4">In certain circumstances, you have the following data protection rights:</p>
      <ul className="list-disc list-inside ml-4 mb-6 space-y-1">
        <li>
          <strong>The right to access, update or delete the information we have on you.</strong> Whenever made possible, you can access,
          update or request deletion of your Personal Data directly within your account settings section. If you are unable to perform
          these actions yourself, please contact us to assist you.
        </li>
        <li>
          <strong>The right of rectification.</strong> You have the right to have your information rectified if that information is
          inaccurate or incomplete.
        </li>
        <li>
          <strong>The right to object.</strong> You have the right to object to our processing of your Personal Data.
        </li>
        <li>
          <strong>The right of restriction.</strong> You have the right to request that we restrict the processing of your personal
          information.
        </li>
        <li>
          <strong>The right to data portability.</strong> You have the right to be provided with a copy of the information we have on you
          in a structured, machine-readable and commonly used format.
        </li>
        <li>
          <strong>The right to withdraw consent.</strong> You also have the right to withdraw your consent at any time where Seedcore
          Foundation dba Beyond Measure relied on your consent to process your personal information.
        </li>
      </ul>
      <p className="mb-6">Please note that we may ask you to verify your identity before responding to such requests.</p>
      <p className="mb-6">
        You have the right to complain to a Data Protection Authority about our collection and use of your Personal Data. For more
        information, please contact your local data protection authority in the European Economic Area (EEA).
      </p>

      <h2 className="text-2xl font-semibold mb-3">Service Providers</h2>
      <p className="mb-4">
        We may employ third party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our
        behalf, perform Service-related services or assist us in analysing how our Service is used.
      </p>
      <p className="mb-6">
        These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose
        or use it for any other purpose.
      </p>

      <h3 className="text-xl font-semibold mb-2">Analytics</h3>
      <p className="mb-4">
        We may use third-party Service Providers to monitor and analyse the use of our Service.
      </p>
      <p className="mb-6 pl-4">
        <strong>Google Analytics</strong><br />
        Google Analytics is a web analytics service offered by Google that tracks and reports website traffic. Google uses the data
        collected to track and monitor the use of our Service. This data is shared with other Google services. Google may use the
        collected data to contextualise and personalise the ads of its own advertising network.<br /><br />
        
        You can opt-out of having made your activity on the Service available to Google Analytics by installing the Google Analytics
        opt-out browser add-on. The add-on prevents the Google Analytics JavaScript (ga.js, analytics.js and dc.js) from sharing
        information with Google Analytics about visits activity.<br /><br />
        
        For more information on the privacy practices of Google, please visit the Google Privacy & Terms web page:<br />
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://policies.google.com/privacy</a>
      </p>

      <h2 className="text-2xl font-semibold mb-3">Children's Privacy</h2>
      <p className="mb-4">
        Our Service does not address anyone under the age of 18 ("Children").
      </p>
      <p className="mb-4">
        We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian
        and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected
        Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
      <p className="mb-4">
        We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the
        "effective date" at the top of this Privacy Policy.
      </p>
      <p className="mb-4">
        You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they
        are posted on this page.
      </p>

      <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us:
      </p>
      <ul className="list-disc list-inside ml-4 mb-6">
        <li>By email: privacy@gobeyondmeasure.org</li>
        <li>By visiting the contact page on our website: <Link href="/contact" className="text-blue-600 hover:underline">gobeyondmeasure.org/contact</Link></li>
      </ul>
    </div>
  );
} 