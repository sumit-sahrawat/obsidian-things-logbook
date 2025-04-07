import { App } from "obsidian";
import { ISettings } from "./settings";
import { ISubTask, ITask } from "./things";
import { getHeadingLevel, getTab, groupBy, toHeading } from "./textUtils";

export class LogbookRenderer {
  private app: App;
  private settings: ISettings;

  constructor(app: App, settings: ISettings) {
    this.app = app;
    this.settings = settings;
    this.renderTask = this.renderTask.bind(this);
    this.collapseEmptyLines = this.collapseEmptyLines.bind(this);
  }

  renderTask(task: ITask): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = this.app.vault as any;
    const tab = getTab(vault.getConfig("useTab"), vault.getConfig("tabSize"));
    const prefix = this.settings.tagPrefix;

    const tags = task.tags
      .filter((tag) => !!tag)
      .map((tag) => tag.replace(/\s+/g, "-").toLowerCase())
      .map((tag) => `#${prefix}${tag}`)
      .join(" ");

    const taskTitle = `[${task.title}](things:///show?id=${task.uuid}) ${tags}`.trimEnd()

    const notes = this.settings.doesSyncNoteBody
      ? String(task.notes || "")
        .trimEnd()
        .split("\n")
        .filter((line) => !!line)
        .map((noteLine) => `${tab}${noteLine}`)
      : ""

    return [
      `- [${task.cancelled ? this.settings.canceledMark : 'x'}] ${taskTitle}`,
      ...notes,
      ...task.subtasks.map(
        (subtask: ISubTask) =>
          `${tab}- [${subtask.completed ? "x" : " "}] ${subtask.title}`
      ),
    ]
      .filter((line) => !!line)
      .join("\n");
  }

  collapseEmptyLines(lines: string[]): string[] {
    const result: string[] = [];
    let previousWasEmpty = false;

    for (const line of lines) {
      const isEmpty = line.trim() === "";

      if (isEmpty && !previousWasEmpty) {
        // only push one empty line for consecutive ones
        result.push("");
        previousWasEmpty = true;
      } else {
        result.push(line);
        previousWasEmpty = false;
      }
    }

    return result;
  }

  public render(tasks: ITask[]): string {
    const {
      sectionHeading,
      doesSyncProject,
      doesCollapseEmptyLines,
      doesAddNewlineAfterSectionHeading,
      doesAddNewlineBeforeHeadings,
      doesAddNewlineAfterHeadings,
    } = this.settings;

    const headings = groupBy<ITask>(tasks, (task) => task.area || (doesSyncProject ? task.project : "") || "");
    const headingLevel = getHeadingLevel(sectionHeading);

    const output = [sectionHeading];
    if (doesAddNewlineAfterSectionHeading) {
      output.push("");
    }

    Object.entries(headings).map(([heading, tasks]) => {
      if (heading !== "") {
        if (doesAddNewlineBeforeHeadings) {
          output.push("");
        }

        output.push(toHeading(heading, headingLevel + 1));

        if (doesAddNewlineAfterHeadings) {
          output.push("");
        }
      }
      output.push(...tasks.map(this.renderTask));
    });

    if (doesCollapseEmptyLines) {
      return this.collapseEmptyLines(output).join("\n");
    }

    return output.join("\n");
  }
}
