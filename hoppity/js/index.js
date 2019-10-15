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

  $(".card:not(.show)").each((index, elem) => {
    $(elem).children().children(".textarea-holder").slideUp(0);
  });

  $(".title").click((event) => {
    const $card = $(event.target).parent().parent().parent();
    if (!$card.hasClass("show")) {
      $card.addClass("show");
      const $body = $card.children().children(".textarea-holder").slideDown(200);
      $card.siblings(".show").each((index, elem) => {
        $(elem).removeClass("show");
        const $body = $(elem).children().children(".textarea-holder").slideUp(200);
      });
    }
  });

  $(".run-example").each((idx, elem) => {
    const $textarea = $(elem).parent().parent().children("textarea");
    $(elem).click(() => {
      let code = $textarea.val();
      $.ajax({
        url: "http://drake.cis.upenn.edu/hoppity/find_bug",
        type: "post",
        data: { code },
        success: (data) => {
          console.log(data);
        },
      });
    });
  });
}

function main() {
  loadExampleIndex((exampleIndex) => {
    loadExamples(exampleIndex, (editors) => {
      setup(editors);
    });
  });
}

main();