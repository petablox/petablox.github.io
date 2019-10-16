function loadExampleIndex(callback) {
  $.ajax({
    url: "examples/index.json",
    type: "get",
    contentType: "text/json",
    success: callback
  });
}

function loadExamples(examples, callback) {
  const template = document.querySelector("#code-example-template");
  const target = document.querySelector("#code-examples");
  const editors = [];
  (function loop(index) {
    if (index < examples.length) {
      const { file, bugs } = examples[index];
      $.ajax({
        url: file,
        type: "get",
        contentType: "text/plain",
        success: (result) => {
          $.ajax({
            url: bugs,
            type: "get",
            contentType: "text/plain",
            success: (bugs) => {
              const clone = document.importNode(template.content, true);
              const textarea = clone.querySelector("textarea");
              const id = clone.querySelector(".example-id");
              id.innerHTML = (index + 1);
              textarea.value = result;
              target.appendChild(clone);
              const editor = CodeMirror.fromTextArea(textarea, {
                mode: "javascript",
                lineNumbers: true,
              });
              editors[index] = editor;
              for (const { from, to } of bugs) {
                editor.markText(
                  { line: from.line, ch: from.ch },
                  { line: to.line, ch: to.ch },
                  { className: "code-bug-mark" },
                );
              }
              loop(index + 1);
            }
          });
        }
      });
    } else {
      callback(editors);
    }
  })(0);
}

function setup(editors) {
  $(".card:first-child").addClass("show");

  $(".card:not(.show)").each((_, elem) => {
    $(elem).children().children(".textarea-holder").slideUp(0);
  });

  $(".card-title").click((event) => {
    const $card = $(event.currentTarget).parent().parent();
    if (!$card.hasClass("show")) {
      $card.addClass("show");
      $card.children().children(".textarea-holder").slideDown(200);
      $card.siblings(".show").each((index, elem) => {
        $(elem).removeClass("show");
        $(elem).children().children(".textarea-holder").slideUp(200);
      });
    }
  });

  $(".run-example").each((index, elem) => {
    $(elem).click(() => {
      const editor = editors[index];
      if (!$(elem).hasClass("disabled")) {
        $(elem).addClass("disabled");
        let code = editor.getValue();
        findBugs(code, (result) => {
          const editor = editors[index];
          for (const mark of editor.getAllMarks()) {
            mark.clear();
          }
          let level = 0;
          for (const { loc } of result) {
            level += 1;
            for (const { start, end } of loc) {
              editor.markText(
                { line: start.line - 1, ch: start.column },
                { line: end.line - 1, ch: end.column },
                { className: `code-bug-mark-${level}` },
              );
            }
          }
        }, () => {
          $(elem).removeClass("disabled");
        });
      }
    });
  });
}

function findBugs(code, callback, final) {

  // Change to this when tested
  $.ajax({
    url: "https://drake.cis.upenn.edu/hoppity/find_bug",
    type: "post",
    data: { code },
    success: (result) => {
      if ("code" in result) {
        alert(result.msg);
      } else {
        callback(result.content);
      }
    },
    complete: final
  });

  // callback([{
  //   "op": "add_node",
  //   "loc": [{
  //     "start": { "line": 0, "column": 0, "offset": 2116 },
  //     "end": { "line": 0, "column": 3, "offset": 2140 }
  //   }],
  //   "value": "False",
  //   "type": "LiteralBooleanExpression",
  //   "ch_rank": 1
  // }, {
  //   "op": "add_node",
  //   "loc": [{
  //     "start": { "line": 1, "column": 4, "offset": 2116 },
  //     "end": { "line": 1, "column": 6, "offset": 2140 }
  //   }],
  //   "value": "True",
  //   "type": "LiteralBooleanExpression",
  //   "ch_rank": 1
  // }, {
  //   "op": "add_node",
  //   "loc": [{
  //     "start": { "line": 2, "column": 7, "offset": 722 },
  //     "end": { "line": 2, "column": 9, "offset": 745 }
  //   }],
  //   "value": "20",
  //   "type": "LiteralNumericExpression",
  //   "ch_rank": 2
  // }]);
}

function main() {
  loadExampleIndex((exampleIndex) => {
    loadExamples(exampleIndex, (editors) => {
      setup(editors);
    });
  });
}

main();