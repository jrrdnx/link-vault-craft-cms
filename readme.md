# DO NOT USE THIS

# Link Vault for Craft 3

### Protect and track downloads on your site. Prevent and track leech attempts.

### Requirements

* Craft CMS v3.0.0+
* PHP 7.0+

### Installation

1. Place the "linkvault" folder in the craft/plugins/ folder of your project.
2. Install the plugin the usual way from the Craft CMS control panel.

### Settings

**Leech Attempt Template**

This template will load with a 403 status whenever someone attempts to leech a download URL as long as leech blocking is enabled. Link Vault provides a default template to use if this setting is left blank.

**Missing File Template**

This template will load with a 404 status whenever someone attempts to download a file that doesn't exist. Link Vault provides a default template to use if this setting is left blank.

### Config Variables

Link Vault has a number of config variables that can be overridden by creating a linkvault.php file in your project's craft/config/ folder. The defaults are displayed below.

```
<?php

return array(
    // Set to "true" for additional logging.
    'debug' => false,
    // The route URI to use when generating download URLs.
    'downloadTrigger' => 'download',
    // Set to "true" to prevent file leeching.
    'blockLeechAttempts' => true,
    // Set to "true" to log leech attempts.
    'logLeechAttempts' => true
);
```

### Template Variables

#### downloadURL

The download URL accepts two parameters:

* file - This may either be an instance of an _AssetFileModel_ or it may be a string path to a file on the server.
* additional parameters - This is an array of custom fields or other variables to be saved to the download record.

**Examples**

```
{# Example 1: Passing an AssetFileModel instance. #}
{% for download in entry.downloadableAssets %}
    <a href="{{ craft.linkVault.downloadURL(download) }}" >Download This</a>
{% endfor %}

{# Example 2: Passing a system path. This method will vary based on your Asset source path setting. #}
{% for download in entry.downloadableAssets %}
    {% set filePath = craft.linkVault.parseEnvironmentString( download.source.settings['path']~download.getFolder().path )~download.filename %}
    <a href="{{ craft.linkVault.downloadURL(filePath) }}" >Download This</a>
{% endfor %}

{# Example 3: A hard-coded full system path. #}
<a href="{{ craft.linkVault.downloadURL('/home/user1337/www/uploads/songs/love.mp3') }}" >Download This</a>

{# Example 4: A full URL to a remote file. #}
<a href="{{ craft.linkVault.downloadURL('http://example.com/downloads/art/cat-rides-bike.zip') }}" >Download This</a>
```

As you can see, passing an instance of an _AssetFileModel_ is the simplest way to create a Link Vault download URL. This method also works for files stored on an S3 source.

Below are some examples that make use of the second parameter to pass along element IDs. In Craft, entries and assets are both have unique element IDs. It is entirely up to you what you store in this column. It is for informational use only.

```
{# Example 5: The asset's parent entry's ID is stored in the elementId column. #}
{% for download in entry.downloadableAssets %}
    <a href="{{ craft.linkVault.downloadURL(download, {elementId : entry.id}) }}" >Download This</a>
{% endfor %}

{# Example 6: The asset's ID is stored in the elementId column. #}
{% for download in entry.downloadableAssets %}
    <a href="{{ craft.linkVault.downloadURL(download, {elementId : download.id}) }}" >Download This</a>
{% endfor %}
```

You can create custom fields to store any data you like with Link Vault. These fields are created from the Link Vault area in the control panel. Once you do create a field, just use the field's handle in the array parameter.

```
{# Example 7: Passing along a value for a user-defined field. #}
{% for download in entry.downloadableAssets %}
    <a href="{{ craft.linkVault.downloadURL(download, {userEmail : craft.session.getUser().email}) }}" >Download This</a>
{% endfor %}
```

#### totalDownloads

The __totalDownloads__ variable returns the total downloads for a given set of criteria. It is very similar to the **downloadURL** variable except it only has one parameter which can be one of three things:

* An instance of an _AssetFileModel_
* An array of parameters
* A string containing the full system path to a file.

**Examples**

```
{# Example 8: Passing an AssetFileModel. #}
{% for download in entry.downloadableAssets %}
    <p>The {{ download.filename }} file has been downloaded {{ craft.linkVault.totalDownloads(download) }} times!</p>
{% endfor %}

{# Example 9: Passing an array of parameters. #}
{% for download in entry.downloadableAssets %}
    <p>Your bird.txt Downloads: {{ craft.linkVault.totalDownloads({userId:craft.session.getUser().id, fileName:"bird.txt" }) }}</p>
{% endfor %}

{# Example 10: Passing a string containing the full system path. #}
Total face.gif downloads: {{ craft.linkVault.totalDownloads('/home/user1337/www/uploads/face.gif') }}

{# Example 11: Passing a URL. #}
Downloads: {{ craft.linkVault.totalDownloads('https://example.com/documents/contract.docx') }}
```

#### fileSize

The __fileSize__ template variable fetches a human-readable file size string for a specified file. This can be used for server files not stored in Craft as assets though it will work with asset files as well. For asset elements, the native `{{ file.size|filesize }}` may be preferable.

**Examples**

```
{# Example 12: Passing a file path. #}
bees.jpg is {{ craft.linkVault.fileSize('/home/user1337/hidden-files/bees.jpg') }}.

{# Example 13: Passing an instance of an AssetFileModel #}
{{ file.filename }} is {{ craft.linkVault.fileSize(file) }}.

{# Example 14: Passing a URL. WARNING: The fileSize variable is sometimes inconsistent with remote files any may not always return a file size. #}
{{ craft.linkVault.fileSize('https://example.com/songs/dance-me-to-the-end-of-love.flac') }}
```

#### downloads

The __downloads__ template variable fetches download records based on the specified criteria.

**Examples**

```
{# Example 15: Fetch the ten most recent download records for cheese.mpg. #}
{% for record in craft.linkVault.downloads.fileName('cheese.mpg).limit(10) %}
    <p>User {{ record.userId }} downloaded it on {{ record.dateCreated }}</p>
{% endfor %}

{# Example 16: Fetch 5 most recent downloads that occurred prior to March 1, 2016. #}
{% for record in craft.linkVault.downloads.before('2016-03-01').limit(10) %}
    <p>User {{ record.userId }} downloaded {{ record.filename }} before March 1.</p>
{% endfor %}

{# Example 17: Fetch records based on custom field value. In this example, assume existence of "downloadPage" field. #}
{% for record in craft.linkVault.downloads.downloadPage('super-mega-rockstar/free-songs') %}
    <p>User {{ record.userId }} downloaded {{ record.filename }} song file on {{ record.dateCreated }}</p>
{% endfor %}
```

#### leechAttempts

The __leechAttempts__ template variable works in the exact same manner as the __downloads__ variable except that it only return leech attempt records.

#### records

The __records__ template variables works in the same manner as __downloads__ and __leechAttempts__ variables except it will return all records regardless of type.

### groupCount (Added in v1.0.2)

The __groupCount__ template variable queries record counts and groups them by a particular column name.

```
{# Example 1: Fetch a particular user's top file downloads. Order the results by the count variable, descending. #}
{% set topDownloads = craft.linkVault.groupCount('fileName', {
    'userId' : currentUser.id,
    'order' : 'census desc'
}) %}
<ol>
{% for topDownload in topDownloads %}
    <li>{{ topDownload.fileName }} ({{ topDownload.census|number_format(0) }} downloads)</li>
{% endfor %}
</ol>
```