# Sample usage: python log_parser.py logfile.log --level info --tag prompt,response

import json
import argparse

def parse_logs(file_path, level_filter=None, tags_filter=None):
    with open(file_path, 'r') as file:
        lines = file.readlines()

        # Add commas to all lines except the last one
        content = ''.join(line.rstrip('\r\n') + ',\n' for line in lines[:-1])
        content += lines[-1]

        # Check if square brackets are missing and add them
        if not content.startswith('['):
            content = '[' + content
        if not content.endswith(']'):
            content = content + ']'

        logs = json.loads(content)

    filtered_logs = []

    for log in logs:
        # Check if the log matches the specified level and tags
        level_condition = level_filter is None or ('level' in log and log['level'] == level_filter)
        tags_condition = tags_filter is None or ('tags' in log and any(tag == log['tags'] for tag in tags_filter.split(',')))

        if level_condition and tags_condition:
            filtered_logs.append(log)

    return filtered_logs

def main():
    parser = argparse.ArgumentParser(description='JSON Log Parser')
    parser.add_argument('file_path', help='Path to the JSON log file')
    parser.add_argument('--level', help='Filter by log level')
    parser.add_argument('--tag', help='Filter by log tag')

    args = parser.parse_args()

    try:
        filtered_logs = parse_logs(args.file_path, args.level, args.tag)

        if filtered_logs:
            print(json.dumps(filtered_logs, indent=2))
        else:
            print('No matching logs found.')

    except FileNotFoundError:
        print(f"Error: File not found at path '{args.file_path}'.")

if __name__ == "__main__":
    main()
