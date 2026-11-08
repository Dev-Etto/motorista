const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const INCLUDED = [
  { domain: 'file', path: 'SQLite/' },
  { domain: 'database', path: '.' },
  { domain: 'sharedpref', path: '.' },
];

const EXCLUDED = [
  { domain: 'sharedpref', path: 'shift_timer.xml' },
  { domain: 'sharedpref', path: 'floating_button.xml' },
];

const rules = (extra) =>
  [
    ...INCLUDED.map((rule) => `<include domain="${rule.domain}" path="${rule.path}"${extra} />`),
    ...EXCLUDED.map((rule) => `<exclude domain="${rule.domain}" path="${rule.path}" />`),
  ].join('\n    ');

const FULL_BACKUP = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    ${rules(' requireFlags="clientSideEncryption"')}
</full-backup-content>
`;

const DATA_EXTRACTION = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup disableIfNoEncryptionCapabilities="true">
    ${rules('')}
  </cloud-backup>
  <device-transfer>
    ${rules('')}
  </device-transfer>
</data-extraction-rules>
`;

function withRuleFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const dir = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'backup_rules.xml'), FULL_BACKUP);
      fs.writeFileSync(path.join(dir, 'data_extraction_rules.xml'), DATA_EXTRACTION);
      return modConfig;
    },
  ]);
}

function withRuleAttributes(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application[0];
    application.$['android:fullBackupContent'] = '@xml/backup_rules';
    application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    return modConfig;
  });
}

module.exports = function withBackupRules(config) {
  return withRuleAttributes(withRuleFiles(config));
};

module.exports.FULL_BACKUP = FULL_BACKUP;
module.exports.DATA_EXTRACTION = DATA_EXTRACTION;
