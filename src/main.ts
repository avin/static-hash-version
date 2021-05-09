import * as fs from "fs";
import * as path from "path";
import cheerio, { CheerioAPI } from "cheerio";
import * as _ from "lodash";
import * as crypto from "crypto";
import { BinaryToTextEncoding } from "crypto";

const generateChecksum = (
  str: string,
  algorithm = "sha1",
  encoding: BinaryToTextEncoding = "hex"
) => {
  return crypto.createHash(algorithm).update(str, "utf8").digest(encoding);
};

const decodeQueryParamsString = (queryParamsString: string) => {
  return (
    _.chain(queryParamsString)
      .replace("?", "")
      .split("&")
      // @ts-ignore
      .map(_.partial(_.split, _, "=", 2))
      .fromPairs()
      .value()
  );
};

const objectToQueryString = (
  obj: Record<string, string>,
  keepEmpty = false
) => {
  const results: string[] = [];
  _.forOwn(obj, (value, key) => {
    if (!keepEmpty && (value === null || value === undefined)) {
      return;
    }
    if (Array.isArray(value)) {
      _.forOwn(value, (iValue) => {
        results.push(`${key}[]=${encodeURIComponent(iValue)}`);
      });
    } else {
      results.push(`${key}=${encodeURIComponent(value)}`);
    }
  });
  return results.join("&");
};

interface ProcessFileTagOptions {
  $: CheerioAPI;
  tagSelector: string;
  fileAttr: string;
  htmlFilePath: string;
  withIntegrity?: boolean;
  withVersion?: boolean;
  onFileAbsence?: (x: string) => void;
}

const processFileTag = (
  content: string,
  {
    $,
    tagSelector,
    fileAttr,
    htmlFilePath,
    withIntegrity = false,
    withVersion = true,
    onFileAbsence = _.noop,
  }: ProcessFileTagOptions
) => {
  $(tagSelector).each(function () {
    const currentSrc = $(this).attr(fileAttr);
    if (currentSrc && !currentSrc.includes("://")) {
      // Parse file-link
      const currentSrcParts = currentSrc.split("?");
      const urlFile = currentSrcParts[0];
      const urlParams = currentSrcParts[1];
      let urlParamsObj: Record<string, string> = {};
      if (urlParams) {
        urlParamsObj = decodeQueryParamsString(urlParams);
      }

      const filePath = path.resolve(htmlFilePath, "..", urlFile);
      if (!fs.existsSync(filePath)) {
        onFileAbsence(filePath);

        return;
      }
      const fileContent = fs.readFileSync(filePath, "utf8");
      const fileCheckSum = generateChecksum(fileContent).substring(0, 10);

      let integrityAttributesStr = "";
      if (withIntegrity && filePath.endsWith(".js")) {
        const sha384CheckSum = generateChecksum(
          fileContent,
          "sha384",
          "base64"
        );
        integrityAttributesStr = ` integrity="sha384-${sha384CheckSum}" crossorigin="anonymous"`;
      }

      // Генерим новую ссылку на файл
      let resultSrc = urlFile;
      if (withVersion) {
        urlParamsObj["v"] = fileCheckSum;
        resultSrc = `${urlFile}?${objectToQueryString(urlParamsObj)}`;
      }

      content = content.replace(
        `"${currentSrc}"`,
        `"${resultSrc}"${integrityAttributesStr}`
      );
    }
  });

  return content;
};

interface StaticHashVersionOptions {
  htmlFilePath: string;
  writeToFile?: boolean;
  tags?: {
    tagSelector: string;
    fileAttr: string;
    withIntegrity: boolean;
    withVersion: boolean;
  }[];
  onFileAbsence?: (filePath: string) => void;
}

function staticHashVersion({
  htmlFilePath,
  writeToFile = false,
  tags = [
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
  onFileAbsence = _.noop,
}: StaticHashVersionOptions): string {
  let content = fs.readFileSync(htmlFilePath, "utf8");

  // Parse HTML
  const $ = cheerio.load(content, {
    decodeEntities: false,
  });

  tags.forEach(({ tagSelector, fileAttr, withIntegrity, withVersion }) => {
    content = processFileTag(content, {
      $,
      tagSelector,
      fileAttr,
      htmlFilePath,
      withIntegrity,
      withVersion,
      onFileAbsence,
    });
  });

  if (writeToFile) {
    fs.writeFileSync(htmlFilePath, content);
  }

  return content;
}

export = staticHashVersion;
