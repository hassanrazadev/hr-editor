const HREditor = (() => {
    let currentSelection = null;
    let changeCallback = null;
    let imageHandler = null;
    let videoHandler = null;

    const defaultConfig = {
        toolbar: ['heading', 'bold', 'italic', 'underline', 'undo', 'redo', 'indent', 'outdent', 'justifyLeft', 'justifyCenter', 'justifyRight', 'createLink', 'insertImage', 'insertVideo', 'unorderedList', 'orderedList']
    };
    let editor = null;

    const toolbarButtons = {
        heading: `<select class="heading">
                    <option value="P">Paragraph</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="H3">Heading 3</option>
                  </select>`,
        bold: `<button type="button" data-command="bold"><i class="fas fa-bold"></i></button>`,
        italic: `<button type="button" data-command="italic"><i class="fas fa-italic"></i></button>`,
        underline: `<button type="button" data-command="underline"><i class="fas fa-underline"></i></button>`,
        undo: `<button type="button" data-command="undo"><i class="fas fa-undo"></i></button>`,
        redo: `<button type="button" data-command="redo"><i class="fas fa-redo"></i></button>`,
        indent: `<button type="button" data-command="indent"><i class="fas fa-indent"></i></button>`,
        outdent: `<button type="button" data-command="outdent"><i class="fas fa-outdent"></i></button>`,
        justifyLeft: `<button type="button" data-command="justifyLeft"><i class="fas fa-align-left"></i></button>`,
        justifyCenter: `<button type="button" data-command="justifyCenter"><i class="fas fa-align-center"></i></button>`,
        justifyRight: `<button type="button" data-command="justifyRight"><i class="fas fa-align-right"></i></button>`,
        createLink: `<button type="button" data-command="createLink"><i class="fas fa-link"></i></button>`,
        insertImage: `<div class="dropdown">
                         <button type="button" id="imageButton"><i class="fas fa-image"></i></button>
                         <div class="dropdown-content">
                             <div class="content-inner">
                                 <button type="button" id="imageUploadButton">Upload Image</button>
                                 <button type="button" id="imageUrlButton">Insert Image URL</button>
                                 <input type="file" id="imageUpload" style="display:none;" accept="image/*">
                             </div>
                         </div>
                      </div>`,
        insertVideo: `<div class="dropdown">
                         <button type="button" id="videoButton"><i class="fas fa-video"></i></button>
                         <div class="dropdown-content">
                             <div class="content-inner">
                                 <button type="button" id="videoUploadButton">Upload Video</button>
                                 <button type="button" id="videoUrlButton">Insert Video URL</button>
                                 <input type="file" id="videoUpload" style="display:none;" accept="video/*">
                             </div>
                         </div>
                      </div>`,
        unorderedList: `<button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>`,
        orderedList: `<button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>`
    };

    const commandsWithPrompts = {
        createLink: 'Enter the link URL'
    };

    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount) {
            currentSelection = sel.getRangeAt(0);
        }
    }

    function restoreSelection() {
        if (currentSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(currentSelection);
        }
    }

    function insertElementAtCursor(element) {
        restoreSelection();
        if (currentSelection) {
            currentSelection.deleteContents();
            currentSelection.insertNode(element);
            saveSelection();
            triggerChange();
        }
    }

    function triggerChange() {
        if (changeCallback && editor) {
            changeCallback(editor.innerHTML);
        }
    }

    function createToolbar(config) {
        const toolbar = document.createElement('div');
        toolbar.className = 'hr-toolbar';
        (config.toolbar || defaultConfig.toolbar).forEach(button => {
            toolbar.innerHTML += toolbarButtons[button] || '';
        });
        return toolbar;
    }

    function handleToolbarButtonClick(button, editor) {
        const command = button.getAttribute('data-command');
        if (commandsWithPrompts[command]) {
            const value = prompt(commandsWithPrompts[command]);
            if (value) document.execCommand(command, false, value);
        } else {
            document.execCommand(command, false, null);
        }
        editor.focus();
        triggerChange();
    }

    function init(container, config = {}) {
        config = { ...defaultConfig, ...config };

        const toolbar = createToolbar(config);
        editor = document.createElement('div');
        editor.className = 'hr-editor';
        editor.contentEditable = true;

        const imageToolbar = document.createElement('div');
        imageToolbar.className = 'hr-image-toolbar';
        imageToolbar.innerHTML = `
            <button type="button" id="floatLeft"><i class="fas fa-align-left"></i></button>
            <button type="button" id="floatRight"><i class="fas fa-align-right"></i></button>
            <button type="button" id="block"><i class="fas fa-align-justify"></i></button>
            <button type="button" id="resize"><i class="fas fa-expand"></i></button>
            <button type="button" id="margin-right"><i class="fa-solid fa-angles-right"></i></button>
            <button type="button" id="margin-left"><i class="fa-solid fa-angles-left"></i></button>
            <button type="button" id="margin-top"><i class="fa-solid fa-angles-up"></i></button>
            <button type="button" id="margin-bottom"><i class="fa-solid fa-angles-down"></i></button>
        `;
        document.body.appendChild(imageToolbar);
        container.style.position = 'relative';

        container.appendChild(toolbar);
        container.appendChild(editor);

        imageHandler = config.imageHandler || null;
        videoHandler = config.videoHandler || null;

        toolbar.querySelectorAll('.heading').forEach(select => {
            select.addEventListener('change', (event) => {
                document.execCommand('formatBlock', false, event.target.value);
                editor.focus();
                triggerChange();
            });
        });

        toolbar.querySelectorAll('button[data-command]').forEach(button => {
            button.addEventListener('click', () => handleToolbarButtonClick(button, editor));
        });

        const handleDropdownButtonClick = (event) => {
            event.stopPropagation();
            const dropdownContent = event.currentTarget.nextElementSibling;
            document.querySelectorAll('.dropdown-content').forEach(dropdown => dropdown.classList.remove('show'));
            dropdownContent.classList.toggle('show');
        };

        toolbar.querySelectorAll('#imageButton, #videoButton').forEach(button => {
            button.addEventListener('click', handleDropdownButtonClick);
        });

        const handleFileUpload = (event, handler) => {
            const file = event.target.files[0];
            if (handler) {
                handler(file);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const media = document.createElement(event.target.accept.startsWith('image') ? 'img' : 'video');
                    media.src = e.target.result;
                    media.className = `hr-editor-${event.target.accept.startsWith('image') ? 'image' : 'video'}`;
                    if (media.tagName === 'VIDEO') media.controls = true;
                    insertElementAtCursor(media);
                    editor.focus();
                };
                reader.readAsDataURL(file);
            }
        };

        const handleUrlInsert = (type) => {
            const url = prompt(`Enter the ${type} URL`);
            if (url) {
                const media = document.createElement(type);
                media.src = url;
                media.className = `hr-editor-${type}`;
                if (media.tagName === 'VIDEO') media.controls = true;
                insertElementAtCursor(media);
                editor.focus();
            }
        };

        const imageUploadInput = toolbar.querySelector('#imageUpload');
        toolbar.querySelector('#imageUploadButton').addEventListener('click', () => imageUploadInput.click());
        imageUploadInput.addEventListener('change', (event) => handleFileUpload(event, imageHandler));

        toolbar.querySelector('#imageUrlButton').addEventListener('click', () => handleUrlInsert('img'));

        const videoUploadInput = toolbar.querySelector('#videoUpload');
        toolbar.querySelector('#videoUploadButton').addEventListener('click', () => videoUploadInput.click());
        videoUploadInput.addEventListener('change', (event) => handleFileUpload(event, videoHandler));

        toolbar.querySelector('#videoUrlButton').addEventListener('click', () => handleUrlInsert('video'));

        document.addEventListener('click', (event) => {
            if (!event.target.matches('#imageButton, #videoButton')) {
                document.querySelectorAll('.dropdown-content').forEach(dropdown => dropdown.classList.remove('show'));
            }
        });

        editor.addEventListener('paste', (event) => {
            const clipboardData = event.clipboardData || window.clipboardData;
            const items = clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image') || items[i].type.startsWith('video')) {
                    event.preventDefault();
                    return;
                }
            }
        });

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const regex = /((https?:\/\/)?[^\s]+\.[^\s]+)/g;
                            let match;
                            while ((match = regex.exec(node.textContent)) !== null) {
                                const url = match[0];
                                const anchor = document.createElement('a');
                                anchor.href = url.startsWith('http') ? url : `http://${url}`;
                                anchor.textContent = url;
                                const range = document.createRange();
                                range.setStart(node, match.index);
                                range.setEnd(node, match.index + url.length);
                                range.deleteContents();
                                range.insertNode(anchor);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(editor, {
            childList: true,
            subtree: true
        });

        editor.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault();
                document.execCommand(event.shiftKey ? 'outdent' : 'indent');
                triggerChange();
            }
        });

        editor.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                document.execCommand('insertParagraph');
                triggerChange();
            }
        });

        editor.addEventListener('input', () => {
            saveSelection();
            triggerChange();
        });

        editor.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
                const rect = target.getBoundingClientRect();
                imageToolbar.style.display = 'block';
                imageToolbar.style.top = `${rect.top - imageToolbar.offsetHeight}px`;
                imageToolbar.style.left = `${rect.left}px`;
                imageToolbar.target = target;
            } else {
                imageToolbar.style.display = 'none';
            }
        });

        function addMarginToElement(element, direction) {
            const style = getComputedStyle(element);
            const currentMargin = `margin${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
            const newMargin = prompt(`Enter margin to ${direction} (px or %)`, style[currentMargin]);
            if (newMargin) {
                element.style[currentMargin] = newMargin;
                triggerChange();
            }
        }

        imageToolbar.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (event) => {
                const target = imageToolbar.target;
                const id = event.currentTarget.id;
                if (id.includes('float')) {
                    target.style.float = id.replace('float', '').toLowerCase();
                } else if (id === 'block') {
                    target.style.display = 'block';
                    target.style.float = 'none';
                } else if (id === 'resize') {
                    const newSize = prompt('Enter new width (px or %)', target.width || target.style.width);
                    if (newSize) {
                        target.style.width = newSize;
                    }
                } else if (id.startsWith('margin')) {
                    const direction = id.split('-')[1];
                    addMarginToElement(target, direction);
                }
                imageToolbar.style.display = 'none';
                triggerChange();
            });
        });

        return {
            onChange(callback) {
                changeCallback = callback;
            },
            insertImage(src) {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'editor-image';
                insertElementAtCursor(img);
                editor.focus();
            },
            insertVideo(src) {
                const video = document.createElement('video');
                video.src = src;
                video.controls = true;
                video.className = 'editor-video';
                insertElementAtCursor(video);
                editor.focus();
            },
            getCursorPosition() {
                return currentSelection;
            },
            setCursorPosition(position) {
                currentSelection = position;
                restoreSelection();
            },
            getContent() {
                return editor.innerHTML;
            },
            setContent(html) {
                editor.innerHTML = html;
                triggerChange();
            }
        };
    }

    return {
        init
    };
})();
