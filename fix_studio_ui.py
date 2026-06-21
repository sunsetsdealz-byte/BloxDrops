"""
Script to systematically update Studio.jsx UI classes for professional alignment
"""

import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_studio_ui():
    file_path = r"C:\bloxdrops\frontend\src\pages\Studio.jsx"
    content = read_file(file_path)
    
    # Track changes
    changes = []
    
    # Fix Photo button (find the multiline pattern)
    pattern1 = r'<button\s+data-testid="studio-mode-photo"[^>]*className=\{`[^`]*`\}[^>]*>\s*<Camera[^/]*/>\s*Photo\s*\{[^}]*\}\s*</button>'
    if re.search(pattern1, content, re.DOTALL):
        # Find and replace the photo button
        photo_button_old = re.search(
            r'(<button\s+data-testid="studio-mode-photo".*?</button>)',
            content,
            re.DOTALL
        )
        if photo_button_old:
            old_text = photo_button_old.group(1)
            new_text = '''<button
                    data-testid="studio-mode-photo"
                    onClick={() => setMode("photo")}
                    className={`studio-mode-button ${mode === "photo" ? "active" : ""}`}
                    title={!isPaid ? "Creator/Pro only" : ""}
                  >
                    <Camera size={14} weight="bold" /> Photo
                    {!isPaid && <Lock size={11} weight="bold" />}
                  </button>'''
            content = content.replace(old_text, new_text, 1)
            changes.append("Updated Photo mode button")
    
    # Close the mode switcher div properly
    content = re.sub(
        r'</button>\s*</div>\s*{mode === "text"',
        '</button>\n                </div>\n              </div>\n\n              {mode === "text"',
        content,
        count=1
    )
    changes.append("Fixed mode switcher closing tags")
    
    # Update textarea for prompt
    content = re.sub(
        r'<textarea\s+data-testid=\{TID\.studioPromptInput\}[^>]*className="[^"]*"',
        '<textarea data-testid={TID.studioPromptInput} className="studio-input',
        content
    )
    changes.append("Updated prompt textarea")
    
    # Update image URL input
    content = re.sub(
        r'<input\s+type="url"[^>]*placeholder="Paste image URL"[^>]*className="[^"]*"',
        '<input type="url" placeholder="Paste image URL..." className="studio-input',
        content
    )
    changes.append("Updated image URL input")
    
    # Update attachment select
    content = re.sub(
        r'<select\s+value=\{attachment\}[^>]*className="[^"]*"',
        '<select value={attachment} onChange={(e) => setAttachment(e.target.value)} className="studio-select',
        content
    )
    changes.append("Updated attachment select")
    
    # Update style select  
    content = re.sub(
        r'<select\s+value=\{style\}[^>]*className="[^"]*"',
        '<select value={style} onChange={(e) => setStyle(e.target.value)} className="studio-select',
        content
    )
    changes.append("Updated style select")
    
    # Update generate buttons
    content = re.sub(
        r'<button\s+onClick=\{generateText\}[^>]*className="btn-volt[^"]*"',
        '<button onClick={generateText} disabled={generating || !prompt.trim()} className="studio-action-button primary',
        content
    )
    changes.append("Updated generate text button")
    
    content = re.sub(
        r'<button\s+onClick=\{generateImage\}[^>]*className="btn-volt[^"]*"',
        '<button onClick={generateImage} disabled={generating || !imageUrl.trim()} className="studio-action-button primary',
        content
    )
    changes.append("Updated generate image button")
    
    # Write back
    write_file(file_path, content)
    
    print("Studio UI Fixes Applied:")
    for i, change in enumerate(changes, 1):
        print(f"  {i}. {change}")
    print(f"\nTotal changes: {len(changes)}")
    print(f"File updated: {file_path}")

if __name__ == "__main__":
    fix_studio_ui()
    print("\n✅ Studio UI alignment improvements complete!")
