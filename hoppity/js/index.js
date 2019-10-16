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
  $(".card").each((index, elem) => {
    $(elem).attr("id", `editor-card-${index}`);
  });

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
          setTimeout(() => {
            for (let i = 0; i < result.length; i++) {
              const level = i + 1;
              setupFloatBox(
                `#editor-card-${index} .code-bug-mark-${level}`,
                `#editor-card-${index} .float-box-${level}`,
                result[i]
              );
            }
          }, 500);
        }, () => {
          $(elem).removeClass("disabled");
        });
      }
    });
  });
}

function renderSingleResult(result) {
  const template = document.querySelector("#prediction-template");
  const clone = $(document.importNode(template.content, true));
  clone.find(".operation").text(getOperation(result.op));
  clone.find(".value").text(result["value"]);
  clone.find(".type").text(result["type"]);
  clone.find(".ch-rank").text(result["ch_rank"]);
  return clone;
}

function getOperation(op) {
  switch (op) {
    case "del_node": return "Delete Node";
    case "add_node": return "Add Node";
    default: return op;
  }
}

function setupFloatBox(hoverSelector, floatBoxSelector, result) {
  const offset = [10, 10];

  $(floatBoxSelector).html(""); // Clear it
  $(floatBoxSelector).append(renderSingleResult(result));

  let is_in = false;

  $(hoverSelector).hover(() => {
    is_in = true;
    $(floatBoxSelector).fadeIn(100);
  }, () => {
    is_in = false;
    setTimeout(() => {
      if (!is_in) {
        $(floatBoxSelector).fadeOut(100);
      }
    }, 10);
  });

  $(hoverSelector).mousemove((event) => {
    let x = event.pageX + offset[0];
    let y = event.pageY + offset[1];
    $(floatBoxSelector).css({
      "left": x,
      "top": y,
    });
  });
}

function findBugs(code, callback, final) {

  // Change to this when tested
  $.ajax({
    url: "https://hoppity.cis.upenn.edu/find_bug",
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
  // final();
}

function main() {
  loadExampleIndex((exampleIndex) => {
    loadExamples(exampleIndex, (editors) => {
      setup(editors);
    });
  });
}

main();