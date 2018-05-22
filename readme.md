# EUCookieLaw3

>  EUROPA websites must follow the Commission's guidelines on [privacy and data protection](http://ec.europa.eu/ipg/basics/legal/data_protection/index_en.htm) and inform 
  users that cookies are not being used to gather information unnecessarily.
   
>  The [ePrivacy directive](http://eur-lex.europa.eu/LexUriServ/LexUriServ.do?uri=CELEX:32002L0058:EN:HTML) – more specifically Article 5(3) – requires prior informed consent for storage for access to information stored on a user's terminal equipment. 
  In other words, you must ask users if they agree to most cookies and similar technologies (e.g. web beacons, Flash cookies, etc.) before the site starts to use them.

>  For consent to be valid, it must be informed, specific, freely given and must constitute a real indication of the individual's wishes.

In this context this solution lives.
It simply alters the default `document.cookie` behavior to disallow cookies to be written on the client side, until the user accept the agreement.
At the same time it blocks all third-party domains you have configured as cookie generators.

# Donations

If you find this script useful, and since I've noticed that nobody did this script before of me,
I'd like to receive [a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=me%40diegolamonica%2einfo&lc=IT&item_name=EU%20Cookie%20Law%203&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHostedGuest). :)


# About this library

**This Javascript the standalone version.** You can find the WordPress version either on 
[GitHub](https://github.com/diegolamonica/EUCookieLaw3-wp) and [WordPress Plugins Repository](#) (awaiting approval). 

The purpose of EUCookieLaw3 is to grant a simple solution to comply the 
[ePrivacy directive](http://eur-lex.europa.eu/LexUriServ/LexUriServ.do?uri=CELEX:32002L0058:EN:HTML) – concerning the cookie consent and General Data Protection Rules (also known as **GDPR**).

There is an older version of this library named just [EUCookieLaw](https://www.github.com/diegolamonica/eucookielaw/) which this one is the direct evolution.

It was developed as new one due the several breaking changes in it.

# How to use it

You can use the [online configuration builder](https://diegolamonica.info/tools/eucookielaw/builder/) 
that allows you to configure its work in the simplest way.

However, if you are a web developer, and you want to go beyond the configurator and manage by your own
the most of the things, here follows the technical documentation.

**Note:** If you don't use Bootstrap 3 on your site you can look for a [theme for EUCookieLaw3](https://github.com/diegolamonica/EUCookieLaw3-themes).  
## Getting start
To let EUCookieLaw to work properly in your web site you must include and initialize it.

```html
<!-- EUCookieLaw 3.0 - BEGIN -->
<script type="text/javascript" src="https://diegolamonica.info/tools/eucookielaw3.min.js"></script>
<script type="text/javascript">
	var cookieLaw = new EUCookieLaw();
</script>
<!-- EUCookieLaw 3.0 - END -->
```

**IMPORTANT** To ensure that EUCookieLaw3 works properly, include it just after the opening `<head>` tag in the HTML like in the example below:

```html
<html>
    <head>
        <!-- Here you will insert EUCookieLaw3 block -->
		
        <!-- EUCookieLaw 3.0 - BEGIN -->
        <script type="text/javascript" src="https://diegolamonica.info/tools/eucookielaw3.min.js"></script>
        <script type="text/javascript">
        	var cookieLaw = new EUCookieLaw();
        </script>
        <!-- EUCookieLaw 3.0 - END -->
    
        <!-- Then goes the rest of your HTML page -->
            
        <meta charset="utf-8">
        <title>My sample header</title>
        ...
    </head>

```

### General properties

The initialization method `new EUCookieLaw()` expects optionally a settings argument in JSON format.

#### `expiringPeriod`

Accepts an integer value that defines the number of days before the agreement expires.

According to the Cookie Law, the maximum number of days should be 365 (1 year) but, considering either the GDPR and the Cookie Law, you must clarify 
which is the maximum period you preserve user data for each treatment.

Default value for this property is `365`

#### `cookieEnabled`

This boolean value changes the behavior of the script. Setting it to `true`, cookies are enabled by default: it means that 
any script is executed on the page is able to store cookie in the client browser. 

If it set to `false`, cookies are not stored until the user consent.

**Note:** because cookies are generated server side so, scripts and images and in general any resource stored on an 
external server that generates cookies, the unwanted external cookies must be blocked creating a blocking group (see method `registerGroup`).

Default value for this property is `false`.

#### `cookieWhiteList`
Some cookies, defined as techincal cookies can be whitelisted. It means that they are allowed to be installed in the 
browser regardless of [`cookieEnabled`](#cookieEnabled) value.

This property accepts an array of cookies with some special rules:

* If starts with a `.` (dot char), it means that the cookie ends with the word that follows the dot 
  ( `.lorem` supposes as allowed cookies `lorem`, `mylorem` and `my_lorem` but disallow `loremipsum` ).
  
* If ends with a `.` (dot char), it means that the cookies begins with the word that preceed the dot 
  ( `lorem.` supposes as allowed cookies `lorem`, `loremipsum` and `lorem_ipsum` but don't accept `my_lorem` ).

* If both starts and ends with a `.` (dot char), all cookies that contains the world into the name (merging both the above rules)

* If no dots is signed both on begin and at the end of the keyword, only the exact name is accepted.

Default value is an empty array.
##### Example of values

```javascript
var cookielaw = new EUCookieLaw({
	cookieWhiteList: [
		'lorem',     /* accepts exactly "lorem" */
		'.ipsum',    /* accepts either "ipsum" and "my_ipsum" */
		'dolor.',    /* accepts either "dolor" and "dolor_amet" */
		'.sit.'      /* accepts "sit", "sith", and "babysitter" */
	]
})
```

#### `agreeMethod`

Throug this property you can choose how the user will give you the consent.

- **On Scroll** (value `EUCookieLaw.CHECK_MODE_ON_SCROLL`) will grant the user to scroll the window to give you the consent. Remember that GDPR requires that the user should give the explicit consent and scroll would be considered as implicit consent. However if your site is not subject to GDPR rules, you can choose for this option.
- **On single** (value `EUCookieLaw.CHECK_MODE_IMMEDIATE`) consent In this way just when the user will accept each of the blocked groups, they will be automatically enabled.
- **On click** (value `EUCookieLaw.CHECK_MODE_ON_CLICK`) If user will click in any point of your page the blocked groups will be accepted in bundle.
- **On consent** (value `EUCookieLaw.CHECK_MODE_ON_CONSENT`) This is the most restrictive mode, indeed the user must choose which groups to consent and, only after the confirm button click, the contents on the page will become available.

Default value for this property is `EUCookieLaw.CHECK_MODE_IMMEDIATE`.

#### `scrollTolerance`

Accepts a numeric value defined in pixels.

If `agreeMethod` is set to `EUCookieLaw.CHECK_MODE_ON_SCROLL` this property tells how many pixels the user should scroll 
the page before assuming he is giving its consent to install third-party cookies.

If `agreeMethod` is any other values than `EUCookieLaw.CHECK_MODE_ON_SCROLL` this property is totaly ignored.

Default value for this property is `200`.

#### `handledNodes`

By default EUCookieLaw manages by its own those HTML nodes: `iframe`, `img`, `script` replacing the `src` attribute if 
the specific node should be blocked, and `link` replacing the `href` attribute if needed.

In the case of `iframe` and `script` the `src` attribute is replaced with `about:blank`.

In the case of `img` attribute is replaced with a *one-trasparent-pixel-data-image*.

The structure of each managed item in this structure is the following:

```json
NODE_NAME: {
	attr: {
		attribute1: 'new-value-1-when-and-if-blocked',
		attribute2: 'new-value-2-when-and-if-blocked'
	}
}  
```
 
#### `openCallback`

This property is a special method that opens the user consent dialog.
If you are not sure what are you doing, please don't touch it.

It will try to open the consent dialog using JQuery and Bootstrap functions, however if no installed will apply `modal-open` class to the `body` and 
`modal-open` class to the EUCookieLaw3 HTML node.

The method accepts as input just one argument that is the consent dialog HTML node.

```javascript
openCallback = function(dialog) {
	/*
	 * do what you want to show consent dialog
	 */
} 
```

**Note:** for further informations about library dependency see the [Dependencies Section](#dependencies).

#### `dialogCookieGroupsListHiddenClass`

With this property you can set which class should be applied to the dialog group list when it is hidden.

Default value for this property is `hidden`.

#### `dialogCookieGroupsListDefaultIsHidden`

This property accepts a boolean value.

You can choose if the list of cookies in the dialog would be visible or not by default.

Default value for this property is `true`.

#### `dialogCookieItemApprovedClass`

Through this property you can set the name of the class for the single group that the user has consented.

Default value for this property is `approved`.

#### `dialogCookieItemRejectedClass`

Through this property you can set the name of the class for the single group that the user has rejected.

Default value for this property is `rejected`.

#### `dialogBuilder`

**DO NOT USE/TOUCH/PASS** Reserved for future implementations.

### Public Methods

#### `allowCookie( cookieName )`

This method allows you to add specific cookie to the whitelist according to the [`cookieWhiteList`](#cookieWhiteList) rules.

#### `setAgreeMode( mode )`

This method allows you to set the `agreeMethod`.

#### `registerGroup( id, name, description)`

Through this method you can create an informative consent group.

* `id` must be unique for a group and can be either a string or a number. It's suggested to use a cohomprensive group 
  identifier and **never change it once the website goes live**.  
  **NOTE:** If same `id` is given for two different groups only the defined first is used.
     
* `name` is the human readable version of the groupId, it's merely descriptive and should be short (eg. *Facebook Social Widget*)
 
* `description` is the full explained version of the name.
 
 This method works in bundle with `registerURL` method.
 
 #### `registerURL( groupId, URL )`

Register a new blocking rule. 

* `groupId` the string that refers to a group idenytified by the `groupId`.
  If the `groupId` does not exists then will be created a group which both `id` and `name` will be the same.
* `URL` can be either a sting or array of strings.  
  Each given string must comply to those assertions:
  
  * The given string is the beginning of the URL (eg. `https://www.example.com/`), files and subdirectories are considered 
    as matched (**ok**: `https://www.example.com/lorem.html`, ok: `https://www.example.com/lorem/ipsum.html`, 
    **ignored**:  `https://api.example.com` )  
  
  * If starts with a `.` (dot char), it means that the the rule will consider both the current domain and any subdomain 
    (**example:** `.example.com` will recognize `www.example.com`, `api.example.com` and `cdn1.api.example.com` ).

#### `handleNode( nodeName, attributes, contentManagement )`

Enable watching on specific node type in the page.

* `nodeName` is the HTML name of the node ( eg. `meta` )
* `attributes` are the list of attributes to watch in a key/pair format where the key is the name of the attribute to 
  take under control and the value is the value to apply if the attribute contains a keyword from a blocking group. 
* `contentManagement` is an object with 2 attributes:
  * `removeContent` accepts boolean value. If `true` and one of the attributes match the given rule, 
    the inner HTML of the element will be removed until the user give his consent for the specific treatment.  
    Thinking with the GDPR point of view, this option can be usefull for HTML forms that requires user consent the specific
    treatment before filling a form. 
  * `lookupInnerText` accepts boolean value. If `true` checks if the text into the element contains the specific keyword 
    defined in the blocking group. 

##### Example of usage
In this example we see how to block a form prior the consent of the user

Assuming the HTML contains a form with class `contact-form` 
```html
<form id="my-special-contact-form" class="contact-form">

	<label for="#your-email-field">Email address:</label>
	<input type="email" id="your-email-field" name="email_address" placeholder="info@example.com" />
	<button type="submit">Register now</button>
</form>
```

You should register a new group in which you will define the rule for the attribute `class` of `FORM` element and mark 
the content to be removed until the user don't give his consent. 

```javascript
var cookieLaw = new EUCookieLaw();

cookieLaw.registerGroup( 
	'dem', 
	'Direct Email Marketing', 
	'You will consent to send you email marketing giving us your email address' 
	);
cookieLaw.registerURL( 'dem', ['contact-form'] );
cookieLaw.handleNode( 'FORM',
	{ id: 'contact-form-removed', class: 'removed' },
	{ removeContent: true, lookupContent: false }
);
```

#### `updateDialogProperty( id, propertyName, value )`

Executes a change for one of the dialog property. This method must be called, if needed, before the user dialog is shown 
because it 

* `id` is the unique identifier of each part of the modal. In the table below you can find the several identifiers.

|id                       | Available Properties | Purpose                     |
|-------------------------|----------------------|-----------------------------|
| `dialog-container`      | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the dialog container
| `dialog`                | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the dialog
| `dialog-content`        | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the dialog content
| `header-container`      | `html`               | HTML Template for this part |
|                         | `titleTag`           | Tag name for the title (default value is `strong`) |
|                         | `content`            | HTML inside the title element (default is `Cookie Policy agreement`) |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the header container
| `body-container`        | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the body container
| `body-text-content`     | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the body text container
|                         | `content`            | HTML inside the modal body element (default is `This site uses cookies`) |
| `body-button-container` | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the body button container
| `review-button`         | `html`               | HTML Template for this part |
|                         | `content`            | HTML inside the review consent button (default is `Review consents`) |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the review button item
| `cookie-group-list`     | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the cookie group list
| `cookie-group-list-item`| `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to each cookie group list item
| `button-container`      | `html`               | HTML Template for this part |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the button container
| `close-button`          | `content`            | HTML inside the close button. Default value is `close` |
|                         | `classes`            | Classes (in the space-separated format) to be applied to the close button
| `footer-container`      | `html`               | HTML Template for this part |

##### Example of usage

```javascript
cookieLaw.updateDialogProperty("review-button", "classes" ,"hidden");
```

#### `coockieLaw.showAlert()`

Shows the user consent dialog.
Using this method you can create a special link on a page which opens the dialog again to
allow users to reconsider their choiches.

```html
<a href="#" onclick="cookieLaw.showAlert();" 
   class="btn btn-primary">Change your choices</a>
``` 

## Tracking consent and rejection (GDPR)

For them who want to manage the consent recording EUCookieLaw has a special callback method invoked on group consent and
rejection. This method must be global in the page and its name must be `userConsentCallback`.
It expects 3 arguments:
* `groupName` the identifier of the group the user gave the consent. 
* `agreement` the status of the consent (`ok` for consent, `ko` for rejection)
* `when` date time string in ISO format.   

EUCookiealw stores a special key in `LocalStorage` named `eucookielaw-client-signature`.
It is a GUID number generated as a random complex value.
You all those values together to create a special consent record.

In the code below there is a simple example: 

```javascript
window.userConsentCallback = function ( groupName, agreement, when ) {
	var guid = localStorage.getItem('eucookielaw-client-signature');
    
    $.ajax({
        url: 'register-consent.php',
        method: 'post',
        data: {
            name: groupName,
            status: agreement,
            when: when,
            guid: guid
        }
    });
};
```

The remote `registe-consent.php` will receive in POST the data. Follows a simple example:
```php
<?php
session_start();

if(!isset($_SESSION['consents'])){
	$_SESSION['consents'] = json_encode([]);
}

$consents = json_decode($_SESSION['consents']);

$consents[] = $_POST;
$_SESSION['consents'] = json_encode($consents);

die('ok');
```
## Dependencies

This library is totally dependency-free. No framework is required, however it works well with jQuery (just if on the page) 
and with BootStrap 3.3 (of which the modal window classes are used).
However there is a [repository](https://github.com/diegolamonica/EUCookieLaw3-themes) where all Frontend developers 
can contribute creating their own style.

# Donations

Again, if you find this script useful, and since I've noticed that nobody did this script before of me,
or simply if you want to show your support, [a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=me%40diegolamonica%2einfo&lc=IT&item_name=EU%20Cookie%20Law%203&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHostedGuest) is really apreciated. :)
