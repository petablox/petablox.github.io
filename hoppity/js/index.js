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

          const clone = document.importNode(template.content, true);
          const textarea = clone.querySelector("textarea");
          const id = clone.querySelector(".example-id");
          id.innerHTML = (index + 1);
          textarea.value = result;
          target.appendChild(clone);
          const editor = CodeMirror.fromTextArea(textarea, {
            mode: "javascript",
            lineNumbers: true,
            lineWrapping: true,
            autofocus: index === 0,
            // viewportMargin: 100,
          });
          editors[index] = editor;
          loop(index + 1);

          // Let's not get bugs for now
          // $.ajax({
          //   url: bugs,
          //   type: "get",
          //   contentType: "text/plain",
          //   success: (bugs) => {
          //     const clone = document.importNode(template.content, true);
          //     const textarea = clone.querySelector("textarea");
          //     const id = clone.querySelector(".example-id");
          //     id.innerHTML = (index + 1);
          //     textarea.value = result;
          //     target.appendChild(clone);
          //     const editor = CodeMirror.fromTextArea(textarea, {
          //       mode: "javascript",
          //       lineNumbers: true,
          //       autofocus: index === 0,
          //     });
          //     editors[index] = editor;
          //     // processResult(bugs, editor, index, () => {
          //       loop(index + 1);
          //     // });
          //   }
          // });
        }
      });
    } else {
      callback(editors);
    }
  })(0);
}

function showResultList($resultHolder) {
  $resultHolder.addClass("active");
}

function setup(editors) {
  $(".card").each((index, elem) => {
    $(elem).attr("id", `editor-card-${index}`);
  });

  $(".card:first-child").addClass("show");

  $(".card:not(.show)").each((_, elem) => {
    $(elem).children().children(".example-body").slideUp(0);
  });

  $(".card-title").click((event) => {
    const $card = $(event.currentTarget).parent().parent();
    if (!$card.hasClass("show")) {
      $card.addClass("show");
      $card.children().children(".example-body").slideDown(200);
      $card.siblings(".show").each((index, elem) => {
        $(elem).removeClass("show");
        $(elem).children().children(".example-body").slideUp(200);
      });
    }
  });

  $(".run-example").each((index, elem) => {
    let $cardBody = $(elem).parent().parent();
    let $exampleBody = $cardBody.find(".example-body");
    let $exampleMask = $cardBody.find(".example-mask");
    let $resultHolder = $cardBody.find(".result-holder");

    function onStart() {
      $(elem).addClass("disabled");
      $exampleMask.css({
        "height": `${$exampleBody.height()}px`,
        "margin-top": `-${$exampleBody.height()}px`,
      }).fadeIn(200);
      $resultHolder.removeClass("active");

      // Turn off the listener
      for (let level = 1; level <= 3; level++) {
        $("body").off("mouseenter mouseleave mousemove", `#editor-card-${index} .code-bug-mark-${level}`);
      }
    }

    function onEnd() {
      $(elem).removeClass("disabled");
      $cardBody.find(".example-mask").fadeOut(200);
    }

    $(elem).click(() => {
      const editor = editors[index];
      if (!$(elem).hasClass("disabled")) {
        onStart();
        let code = editor.getValue();
        findBugs(code, (result) => {
          processResult(result, editors[index], index, () => {
            showResultList($resultHolder);
          });
        }, onEnd);
      }
    });
  });
}

function processResult(result, editor, index, callback) {
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
        {
          className: `code-bug-mark-${level}`,
          startStyle: `left`,
          endStyle: `right`,
        },
      );
    }
  }
  setTimeout(() => {
    for (let i = 0; i < result.length; i++) {
      const level = i + 1;
      setupResult(
        `#editor-card-${index} .code-bug-mark-${level}`,
        `#editor-card-${index} .CodeMirror-scroll`,
        `#editor-card-${index} .float-box-${level}`,
        `#editor-card-${index} .result-list-item-${level}`,
        result[i],
        i
      );
    }
    callback();
  }, 100);
}

function renderSingleResult(result, index) {
  const template = document.querySelector("#prediction-template");
  const clone = $(document.importNode(template.content, true));
  clone.find(".number").text(getNumber(index));
  clone.find(".operation").text(getOperation(result.op));
  clone.find(".value").text(result["value"] || "None");
  clone.find(".type").text(result["type"] || "None");
  clone.find(".ch-rank").text(result["ch_rank"] || "None");
  return clone;
}

function getNumber(index) {
  switch (index) {
    case 0: return "First";
    case 1: return "Second";
    case 2: return "Third";
    default: return index;
  }
}

function getOperation(op) {
  switch (op) {
    case "del_node": return "Delete Node";
    case "add_node": return "Add Node";
    default: return op;
  }
}

function setupResult(hoverSelector, scrollSelector, floatBoxSelector, resultListItemSelector, result, index) {
  const offsetX = -15, offsetY = -110;
  const height = 155;
  const $floatBox = $(floatBoxSelector);
  const $resultListItem = $(resultListItemSelector);

  $floatBox.html(""); // Clear it
  $floatBox.append(renderSingleResult(result, index));

  $resultListItem.html("");
  $resultListItem.append(renderSingleResult(result, index));

  let is_in = false;
  let is_in_result_list_item = false;

  // First clear all the handlers
  $resultListItem.off("mouseenter mouseleave click");

  $resultListItem.hover(() => {
    is_in_result_list_item = true;
    $(hoverSelector).addClass("excited");
  }, () => {
    is_in_result_list_item = false;
    $(hoverSelector).removeClass("excited");
  });

  $resultListItem.click(() => {
    let lineHeight = $(".CodeMirror-code").children().eq(0).outerHeight();
    let scrollTop = (result["loc"][0]["start"]["line"] - 1) * lineHeight;
    console.log(`Scroll to ${scrollTop}`);
    $(scrollSelector).animate({ scrollTop }, () => {
      if (is_in_result_list_item) {
        $(hoverSelector).addClass("excited");
      }
    });
  });

  $("body").on("mouseenter", hoverSelector, () => {
    is_in = true;
    $(hoverSelector).addClass("excited");
    $floatBox.fadeIn(100);
  });

  $("body").on("mouseleave", hoverSelector, () => {
    is_in = false;
    $(hoverSelector).removeClass("excited");
    setTimeout(() => {
      if (!is_in) $floatBox.fadeOut(100);
    }, 10);
  })

  $("body").on("mousemove", hoverSelector, () => {
    const $target = $(event.currentTarget);
    let additionalY = 0;
    let has1 = $target.hasClass("code-bug-mark-1");
    let has2 = $target.hasClass("code-bug-mark-2");
    if (index == 1 && has1) {
      additionalY += height;
    } else if (index == 2) {
      if (has1) additionalY += height;
      if (has2) additionalY += height;
    }
    let x = event.screenX + offsetX;
    let y = event.screenY + offsetY + additionalY;
    $floatBox.css({
      "left": x,
      "top": y,
    });
  });

  // function setupHover() {
  //   const $hover = $(hoverSelector);

  //   $hover.hover(() => {

  //   }, () => {

  //   });

  //   $hover.mousemove((event) => {

  //   });
  // }

  // setupHover();
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