import { App, PluginSettingTab, Setting, moment } from "obsidian";

import type ThingsLogbookPlugin from "./index";

export const DEFAULT_SECTION_HEADING = "## Logbook";
export const DEFAULT_SYNC_FREQUENCY_SECONDS = 30 * 60; // Every 30 minutes
export const DEFAULT_TAG_PREFIX = "logbook/";
export const DEFAULT_CANCELLED_MARK = "c";

export interface ISettings {
  hasAcceptedDisclaimer: boolean;
  latestSyncTime: number;

  doesSyncNoteBody: boolean;
  doesSyncProject: boolean;
  doesCollapseEmptyLines: boolean;
  doesAddNewlineAfterSectionHeading: boolean;
  doesAddNewlineBeforeHeadings: boolean;
  doesAddNewlineAfterHeadings: boolean;
  isSyncEnabled: boolean;
  sectionHeading: string;
  syncInterval: number;
  tagPrefix: string;
  canceledMark: string;
}

export const DEFAULT_SETTINGS = Object.freeze({
  hasAcceptedDisclaimer: false,
  latestSyncTime: 0,

  doesSyncNoteBody: true,
  doesSyncProject: false,
  doesCollapseEmptyLines: false,
  doesAddNewlineAfterSectionHeading: false,
  doesAddNewlineBeforeHeadings: false,
  doesAddNewlineAfterHeadings: false,
  isSyncEnabled: false,
  syncInterval: DEFAULT_SYNC_FREQUENCY_SECONDS,
  sectionHeading: DEFAULT_SECTION_HEADING,
  tagPrefix: DEFAULT_TAG_PREFIX,
  canceledMark: DEFAULT_CANCELLED_MARK
});

export class ThingsLogbookSettingsTab extends PluginSettingTab {
  private plugin: ThingsLogbookPlugin;

  constructor(app: App, plugin: ThingsLogbookPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.addResetLastSyncSetting();

    this.containerEl.createEl("h3", {
      text: "Format Settings",
    });
    this.addSectionHeadingSetting();
    this.addTagPrefixSetting();
    this.addCanceledMarkSetting();

    this.containerEl.createEl("h4", {
      text: "Empty Lines",
    });
    this.addDoesCollapseEmptyLinesSetting();
    this.addDoesAddNewlineAfterSectionHeadingSetting();
    this.addDoesAddNewlineBeforeHeadingsSetting();
    this.addDoesAddNewlineAfterHeadingsSetting();

    this.containerEl.createEl("h3", {
      text: "Sync",
    });
    this.addSyncEnabledSetting();
    this.addSyncIntervalSetting();
    this.addDoesSyncNoteBodySetting();
    this.addDoesSyncProjectSetting();
  }

  addSectionHeadingSetting(): void {
    new Setting(this.containerEl)
      .setName("Section heading")
      .setDesc(
        "Markdown heading to use when adding the logbook to a daily note"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.sectionHeading);
        textfield.onChange(async (rawSectionHeading) => {
          const sectionHeading = rawSectionHeading.trim();
          this.plugin.writeOptions({ sectionHeading });
        });
      });
  }

  addSyncEnabledSetting(): void {
    new Setting(this.containerEl)
      .setName("Enable periodic syncing")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.isSyncEnabled);
        toggle.onChange(async (isSyncEnabled) => {
          this.plugin.writeOptions({ isSyncEnabled });
        });
      });
  }

  addDoesSyncNoteBodySetting(): void {
    new Setting(this.containerEl)
      .setName("Include notes")
      .setDesc('Includes MD notes of a task into the synced Obsidian document')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.doesSyncNoteBody);
        toggle.onChange(async (doesSyncNoteBody) => {
          this.plugin.writeOptions({ doesSyncNoteBody })
        });
      });
  }

  addDoesSyncProjectSetting(): void {
    new Setting(this.containerEl)
        .setName("Include project")
        .setDesc("If the Things task belongs to a project, use project name as header instead of area")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesSyncProject);
          toggle.onChange(async (doesSyncProject) => {
            this.plugin.writeOptions({ doesSyncProject })
          });
        });
  }

  addSyncIntervalSetting(): void {
    new Setting(this.containerEl)
      .setName("Sync Frequency")
      .setDesc("Number of seconds the plugin will wait before syncing again")
      .addText((textfield) => {
        textfield.setValue(String(this.plugin.options.syncInterval));
        textfield.inputEl.type = "number";
        textfield.inputEl.onblur = (e: FocusEvent) => {
          const syncInterval = Number((<HTMLInputElement>e.target).value);
          textfield.setValue(String(syncInterval));
          this.plugin.writeOptions({ syncInterval });
        };
      });
  }

  addTagPrefixSetting(): void {
    new Setting(this.containerEl)
      .setName("Tag Prefix")
      .setDesc(
        "Prefix added to Things tags when imported into Obsidian (e.g. #logbook/work)"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.tagPrefix);
        textfield.onChange(async (tagPrefix) => {
          this.plugin.writeOptions({ tagPrefix });
        });
      });
  }

  addCanceledMarkSetting(): void {
    new Setting(this.containerEl)
        .setName("Canceled Mark")
        .setDesc(
            "Mark character to use for canceled tasks"
        )
        .addText((textfield) => {
          textfield.setValue(this.plugin.options.canceledMark);
          textfield.onChange(async (canceledMark) => {
            this.plugin.writeOptions({ canceledMark });
          });
        });
  }

  addDoesCollapseEmptyLinesSetting(): void {
    new Setting(this.containerEl)
        .setName("Collapse empty lines")
        .setDesc("Merge consecutive empty lines into a single empty line")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesCollapseEmptyLines);
          toggle.onChange(async (doesCollapseEmptyLines) => {
            this.plugin.writeOptions({ doesCollapseEmptyLines });
          });
        });
  }

  addDoesAddNewlineAfterSectionHeadingSetting(): void {
    new Setting(this.containerEl)
        .setName("Empty line after section heading")
        .setDesc("Insert an empty line after the section heading")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesAddNewlineAfterSectionHeading);
          toggle.onChange(async (doesAddNewlineAfterSectionHeading) => {
            this.plugin.writeOptions({ doesAddNewlineAfterSectionHeading });
          });
        });
  }

  addDoesAddNewlineBeforeHeadingsSetting(): void {
    new Setting(this.containerEl)
        .setName("Empty line before headings")
        .setDesc("When grouping tasks with headings by area or project, add an empty line before that heading")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesAddNewlineBeforeHeadings);
          toggle.onChange(async (doesAddNewlineBeforeHeadings) => {
            this.plugin.writeOptions({ doesAddNewlineBeforeHeadings });
          });
        });
  }

  addDoesAddNewlineAfterHeadingsSetting(): void {
    new Setting(this.containerEl)
        .setName("Empty line after headings")
        .setDesc("When grouping tasks with headings by area or project, add an empty line after that heading")
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.options.doesAddNewlineAfterHeadings);
          toggle.onChange(async (doesAddNewlineAfterHeadings) => {
            this.plugin.writeOptions({ doesAddNewlineAfterHeadings });
          });
        });
  }

  addResetLastSyncSetting(): void {
    const { latestSyncTime } = this.plugin.options;
    const syncTime = latestSyncTime > 0 
      ? moment.unix(this.plugin.options.latestSyncTime).fromNow()
      : 'Never';

    new Setting(this.containerEl)
        .setDesc(createFragment(el => {
          el.appendText('Last sync: ');
          el.createSpan({ cls: 'u-pop', text: syncTime });
        }))
        .addButton(button => {
          button.setButtonText('Sync now');
          button.setClass('mod-cta');
          button.onClick(async () => {
            button.setDisabled(true);
            await this.plugin.syncLogbook();
            this.display();
          });
        })
        .addButton(button => {
          button.setButtonText('Reset sync history');
          button.setClass('mod-danger');
          button.onClick(async () => {
            await this.plugin.writeOptions({ latestSyncTime: 0 });
            this.display();
          });
        })
        .addExtraButton(component => {
          component.setIcon('lucide-info');
          component.setTooltip('Reseting the sync history will cause Things Logbook to rewrite rewrite the Logbook to all existing daily notes.');
        });
  }
}
