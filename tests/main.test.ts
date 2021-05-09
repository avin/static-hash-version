import staticHashVersion = require("../src/main");
import shell = require("shelljs");
import path = require("path");
import fs = require("fs");

describe("staticHashVersion", () => {
  const cleanStaticPath = path.join(__dirname, "static");
  const testStaticPath = path.join(__dirname, "test-static");

  beforeEach(() => {
    shell.rm("-rf", testStaticPath);
    shell.cp("-R", cleanStaticPath, testStaticPath);
  });

  afterAll(() => {
    shell.rm("-rf", testStaticPath);
  });

  describe("htmlFilePath", () => {
    it("works fine with valid htmlFile path", () => {
      const testIndexHtmlPath = path.join(testStaticPath, "index-clean.html");

      const result = staticHashVersion({
        htmlFilePath: testIndexHtmlPath,
      });

      expect(result).not.toBeUndefined();
    });

    it("fail on htmlFile read-error", () => {
      expect.assertions(1);
      try {
        staticHashVersion({
          htmlFilePath: "invalid-file-path",
        });
      } catch (e) {
        expect(e.message).not.toBeUndefined();
      }
    });
  });

  describe("writeToFile", () => {
    it("not write to file on false", () => {
      const testIndexHtmlPath = path.join(testStaticPath, "index-clean.html");
      const originalContent = fs.readFileSync(testIndexHtmlPath, "utf8");

      staticHashVersion({
        htmlFilePath: testIndexHtmlPath,
        writeToFile: false,
      });

      expect(originalContent).toEqual(
        fs.readFileSync(testIndexHtmlPath, "utf8")
      );
    });

    it("write to file on true", () => {
      const testIndexHtmlPath = path.join(testStaticPath, "index-clean.html");
      const originalContent = fs.readFileSync(testIndexHtmlPath, "utf8");

      const result = staticHashVersion({
        htmlFilePath: testIndexHtmlPath,
        writeToFile: true,
      });

      expect(originalContent).not.toEqual(
        fs.readFileSync(testIndexHtmlPath, "utf8")
      );
      expect(fs.readFileSync(testIndexHtmlPath, "utf8")).toEqual(result);
    });
  });

  describe("onFileAbsence", () => {
    it("fire callback on file absence", () => {
      const testIndexHtmlPath = path.join(testStaticPath, "index-clean.html");

      const onFileAbsenceFunc = jest.fn();

      staticHashVersion({
        htmlFilePath: testIndexHtmlPath,
        writeToFile: false,
        onFileAbsence: onFileAbsenceFunc,
      });

      expect(onFileAbsenceFunc.mock.calls.length).toBe(1);
      expect(onFileAbsenceFunc.mock.calls[0][0]).toEqual(
        expect.stringMatching(/invalid-file\.js$/)
      );
    });
  });

  describe("tags", () => {
    it("with version", () => {
      const testHtmlFilePath = path.join(testStaticPath, "index-clean.html");
      const validHtmlFilePath = path.join(testStaticPath, "index-js-ver.html");

      const result = staticHashVersion({
        htmlFilePath: testHtmlFilePath,
        tags: [
          {
            tagSelector: "script",
            fileAttr: "src",
            withIntegrity: false,
            withVersion: true,
          },
        ],
      });

      expect(result).toEqual(fs.readFileSync(validHtmlFilePath, "utf8"));
    });

    it("with integrity", () => {
      const testHtmlFilePath = path.join(testStaticPath, "index-clean.html");
      const validHtmlFilePath = path.join(testStaticPath, "index-js-int.html");

      const result = staticHashVersion({
        htmlFilePath: testHtmlFilePath,
        tags: [
          {
            tagSelector: "script",
            fileAttr: "src",
            withIntegrity: true,
            withVersion: false,
          },
        ],
      });

      expect(result).toEqual(fs.readFileSync(validHtmlFilePath, "utf8"));
    });

    it("with version and integrity", () => {
      const testHtmlFilePath = path.join(testStaticPath, "index-clean.html");
      const validHtmlFilePath = path.join(
        testStaticPath,
        "index-js-ver-int.html"
      );

      const result = staticHashVersion({
        htmlFilePath: testHtmlFilePath,
        tags: [
          {
            tagSelector: "script",
            fileAttr: "src",
            withIntegrity: true,
            withVersion: true,
          },
        ],
      });

      expect(result).toEqual(fs.readFileSync(validHtmlFilePath, "utf8"));
    });

    it("two tag types", () => {
      const testHtmlFilePath = path.join(testStaticPath, "index-clean.html");
      const validHtmlFilePath = path.join(
        testStaticPath,
        "index-js-css-ver.html"
      );

      const result = staticHashVersion({
        htmlFilePath: testHtmlFilePath,
        tags: [
          {
            tagSelector: "script",
            fileAttr: "src",
            withIntegrity: false,
            withVersion: true,
          },
          {
            tagSelector: 'link[rel="stylesheet"]',
            fileAttr: "href",
            withIntegrity: false,
            withVersion: true,
          },
        ],
      });

      expect(result).toEqual(fs.readFileSync(validHtmlFilePath, "utf8"));
    });
  });
});
